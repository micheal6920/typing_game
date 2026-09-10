import Peer from 'peerjs'

/**
 * Browser-to-browser multiplayer built on PeerJS (a WebRTC wrapper).
 *
 * IMPORTANT / HONEST LIMITATION:
 * WebRTC cannot establish a direct connection between two browsers out of
 * thin air — the two sides need to exchange connection metadata before a
 * peer-to-peer link exists ("signaling"). This app does not run any
 * signaling server of its own. It uses PeerJS's free, publicly hosted
 * broker (the default PeerServer at 0.peerjs.com) purely to help two
 * browsers find each other. Once that handshake completes, all game data
 * (roster, countdown, live progress, results) flows directly between the
 * players' browsers, not through any server. If PeerJS's public broker is
 * ever unavailable, creating/joining a room will fail even though nothing
 * about your own hosting changed — there is no way to offer true zero-
 * infrastructure multiplayer discovery in a browser.
 *
 * Topology: star. The room creator is the "host" peer and every other
 * player connects only to the host, never to each other. The host relays
 * roster updates, the countdown start, and results to everyone. This is
 * far simpler and more reliable for small friend groups than a full mesh.
 */

const ROOM_PREFIX = 'typingrace-'

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export class MultiplayerSession {
  constructor() {
    this.peer = null
    this.isHost = false
    this.roomCode = null
    this.selfId = null
    this.selfName = null
    this.connections = new Map() // peerId -> DataConnection (host only, keyed by remote peer id)
    this.hostConnection = null // guest only: connection to host
    this.players = new Map() // peerId -> player state (host is authoritative)
    this.listeners = new Set()
  }

  onUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  _emit(event, payload) {
    this.listeners.forEach((cb) => cb(event, payload))
  }

  /** Host flow: create a Peer with a predictable room-code-based id. */
  createRoom(name) {
    return new Promise((resolve, reject) => {
      this.isHost = true
      this.selfName = name
      this.roomCode = randomRoomCode()

      this.peer = new Peer(ROOM_PREFIX + this.roomCode)

      this.peer.on('open', (id) => {
        this.selfId = id
        this.players.set(id, this._newPlayer(id, name, true))
        this._emit('roster', this._playerList())
        resolve(this.roomCode)
      })

      this.peer.on('connection', (conn) => this._handleIncomingConnection(conn))

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          reject(new Error('That room code is already taken. Please try again.'))
        } else {
          reject(new Error(`Connection error: ${err.type}`))
        }
      })
    })
  }

  /** Guest flow: create a random-id Peer, then connect to the host's id. */
  joinRoom(roomCode, name) {
    return new Promise((resolve, reject) => {
      this.isHost = false
      this.selfName = name
      this.roomCode = roomCode.toUpperCase().trim()

      this.peer = new Peer()

      this.peer.on('open', (id) => {
        this.selfId = id
        const conn = this.peer.connect(ROOM_PREFIX + this.roomCode, { reliable: true })
        this.hostConnection = conn

        const timeout = setTimeout(() => {
          reject(new Error('Could not reach that room. Check the code and try again.'))
        }, 8000)

        conn.on('open', () => {
          clearTimeout(timeout)
          conn.send({ type: 'join', name })
          resolve()
        })

        conn.on('data', (msg) => this._handleMessage(msg, conn))

        conn.on('error', () => {
          clearTimeout(timeout)
          reject(new Error('Connection to host failed.'))
        })

        conn.on('close', () => this._emit('host-disconnected'))
      })

      this.peer.on('error', (err) => {
        reject(new Error(`Connection error: ${err.type}`))
      })
    })
  }

  _handleIncomingConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
    })
    conn.on('data', (msg) => this._handleMessage(msg, conn))
    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.players.delete(conn.peer)
      this._broadcastRoster()
    })
  }

  _newPlayer(id, name, isHost) {
    return {
      id,
      name,
      isHost,
      ready: isHost, // host is implicitly ready
      progress: 0,
      wpm: 0,
      accuracy: 100,
      errors: 0,
      finished: false,
      timeSeconds: 0,
    }
  }

  _handleMessage(msg, conn) {
    if (this.isHost) {
      switch (msg.type) {
        case 'join':
          this.players.set(conn.peer, this._newPlayer(conn.peer, msg.name, false))
          this._broadcastRoster()
          break
        case 'ready':
          if (this.players.has(conn.peer)) {
            this.players.get(conn.peer).ready = msg.ready
            this._broadcastRoster()
          }
          break
        case 'progress':
          if (this.players.has(conn.peer)) {
            Object.assign(this.players.get(conn.peer), {
              progress: msg.progress,
              wpm: msg.wpm,
            })
            this._broadcastRoster()
          }
          break
        case 'finished':
          if (this.players.has(conn.peer)) {
            Object.assign(this.players.get(conn.peer), {
              finished: true,
              progress: 100,
              ...msg.result,
            })
            this._broadcastRoster()
            this._maybeFinishRace()
          }
          break
        default:
          break
      }
    } else {
      // Guest receiving relayed messages from host
      switch (msg.type) {
        case 'roster':
          this._emit('roster', msg.players)
          break
        case 'countdown':
          this._emit('countdown', msg)
          break
        case 'final-results':
          this._emit('final-results', msg.results)
          break
        default:
          break
      }
    }
  }

  _broadcastRoster() {
    const list = this._playerList()
    this._emit('roster', list)
    this._broadcast({ type: 'roster', players: list })
  }

  _playerList() {
    return Array.from(this.players.values())
  }

  _broadcast(msg) {
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(msg)
    })
  }

  /** Host only: set my own ready state (host is always ready by definition). */
  setReady(ready) {
    if (this.isHost) {
      this.players.get(this.selfId).ready = ready
      this._broadcastRoster()
    } else {
      this.hostConnection?.send({ type: 'ready', ready })
    }
  }

  /** Host only: begin the race for everyone. */
  startRace(paragraph) {
    if (!this.isHost) return
    const startTime = Date.now() + 3000 // 3s countdown for everyone
    this._broadcast({ type: 'countdown', paragraph, startTime })
    this._emit('countdown', { paragraph, startTime })
  }

  /** Called by any player as they type, throttled by the caller. */
  sendProgress(progress, wpm) {
    if (this.isHost) {
      Object.assign(this.players.get(this.selfId), { progress, wpm })
      this._broadcastRoster()
    } else {
      this.hostConnection?.send({ type: 'progress', progress, wpm })
    }
  }

  /** Called once by any player when they finish typing. */
  sendFinished(result) {
    if (this.isHost) {
      Object.assign(this.players.get(this.selfId), {
        finished: true,
        progress: 100,
        ...result,
      })
      this._broadcastRoster()
      this._maybeFinishRace()
    } else {
      this.hostConnection?.send({ type: 'finished', result })
    }
  }

  _maybeFinishRace() {
    const all = this._playerList()
    if (all.length > 0 && all.every((p) => p.finished)) {
      this._broadcast({ type: 'final-results', results: all })
      this._emit('final-results', all)
    }
  }

  /** Host only: end the race early even if not everyone finished. */
  forceFinish() {
    if (!this.isHost) return
    const all = this._playerList()
    this._broadcast({ type: 'final-results', results: all })
    this._emit('final-results', all)
  }

  destroy() {
    this.connections.forEach((conn) => conn.close())
    this.hostConnection?.close()
    this.peer?.destroy()
    this.listeners.clear()
  }
}
