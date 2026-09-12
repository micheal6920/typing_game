import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayerNameModal from '../components/PlayerNameModal.jsx'
import Countdown from '../components/Countdown.jsx'
import TypingArea from '../components/TypingArea.jsx'
import Timer from '../components/Timer.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import Confetti from '../components/Confetti.jsx'
import { MultiplayerSession } from '../services/multiplayer.js'
import { addHistoryEntry } from '../services/storage.js'
import { getRandomParagraph } from '../utils/paragraphs.js'

const STAGE = {
  NAME: 'name',
  CHOICE: 'choice',
  JOIN_CODE: 'join_code',
  CONNECTING: 'connecting',
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  RESULTS: 'results',
}

export default function Multiplayer() {
  const navigate = useNavigate()
  const sessionRef = useRef(null)

  const [stage, setStage] = useState(STAGE.NAME)
  const [name, setName] = useState('')
  const [players, setPlayers] = useState([])
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [paragraph, setParagraph] = useState('')
  const [raceStartTime, setRaceStartTime] = useState(null)
  const [countdownTarget, setCountdownTarget] = useState(null)
  const [finalResults, setFinalResults] = useState(null)

  useEffect(() => {
    return () => sessionRef.current?.destroy()
  }, [])

  function ensureSession() {
    if (!sessionRef.current) {
      sessionRef.current = new MultiplayerSession()
      sessionRef.current.onUpdate((event, payload) => {
        if (event === 'roster') setPlayers(payload)
        if (event === 'countdown') {
          setParagraph(payload.paragraph)
          setCountdownTarget(payload.startTime)
          setStage(STAGE.COUNTDOWN)
        }
        if (event === 'final-results') {
          setFinalResults(payload)
          setStage(STAGE.RESULTS)
        }
        if (event === 'host-disconnected') {
          setErrorMsg('The host disconnected. Returning to the lobby.')
          setStage(STAGE.CHOICE)
        }
      })
    }
    return sessionRef.current
  }

  function handleNameSubmit(submittedName) {
    setName(submittedName)
    setStage(STAGE.CHOICE)
  }

  async function handleCreateRoom() {
    setErrorMsg('')
    setStage(STAGE.CONNECTING)
    try {
      const session = ensureSession()
      const code = await session.createRoom(name)
      setRoomCode(code)
      setStage(STAGE.WAITING)
    } catch (err) {
      setErrorMsg(err.message)
      setStage(STAGE.CHOICE)
    }
  }

  async function handleJoinRoom(code) {
    setErrorMsg('')
    setStage(STAGE.CONNECTING)
    try {
      const session = ensureSession()
      await session.joinRoom(code, name)
      setRoomCode(code.toUpperCase())
      setStage(STAGE.WAITING)
    } catch (err) {
      setErrorMsg(err.message)
      setStage(STAGE.JOIN_CODE)
    }
  }

  function toggleReady(current) {
    sessionRef.current?.setReady(!current)
  }

  const handleComplete = useCallback((result) => {
    sessionRef.current?.sendFinished(result)
    addHistoryEntry({ mode: 'multiplayer', ...result })
  }, [])

  const handleProgress = useCallback((progress, wpm) => {
    sessionRef.current?.sendProgress(progress, wpm)
  }, [])

  const selfId = sessionRef.current?.selfId
  const self = players.find((p) => p.id === selfId)
  const allReady = players.length > 0 && players.every((p) => p.ready)
  const isHost = sessionRef.current?.isHost

  return (
    <div className="page">
      <div className="page-inner">
        {stage === STAGE.NAME && (
          <PlayerNameModal
            title="Multiplayer"
            defaultName={name}
            buttonLabel="Continue"
            onSubmit={handleNameSubmit}
          />
        )}

        {stage === STAGE.CHOICE && (
          <div className="card" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
            <div className="track-rule" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ margin: '0 0 24px' }}>Create or join a race</h2>
            {errorMsg && <p className="error-text">{errorMsg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-primary btn-block" onClick={handleCreateRoom}>
                Create Race
              </button>
              <button className="btn btn-block" onClick={() => setStage(STAGE.JOIN_CODE)}>
                Join Race
              </button>
            </div>
          </div>
        )}

        {stage === STAGE.JOIN_CODE && (
          <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
            <div className="track-rule" />
            <h2 style={{ margin: '0 0 20px' }}>Enter room code</h2>
            <input
              className="text-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB12C"
              maxLength={5}
              autoFocus
            />
            {errorMsg && <p className="error-text">{errorMsg}</p>}
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 20 }}
              disabled={!joinCode.trim()}
              onClick={() => handleJoinRoom(joinCode)}
            >
              Join
            </button>
          </div>
        )}

        {stage === STAGE.CONNECTING && (
          <p style={{ textAlign: 'center', color: 'var(--text-mid)' }}>Connecting…</p>
        )}

        {stage === STAGE.WAITING && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ color: 'var(--text-mid)', fontSize: 13, margin: '0 0 6px' }}>Room code</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--amber)', margin: 0 }}>
                {roomCode}
              </p>
              <p style={{ color: 'var(--text-low)', fontSize: 13, marginTop: 6 }}>
                Share this code with friends so they can join.
              </p>
            </div>

            <Leaderboard players={players} mode="live" selfId={selfId} />

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!isHost && self && (
                <button className="btn" onClick={() => toggleReady(self.ready)}>
                  {self.ready ? 'Not ready' : "I'm ready"}
                </button>
              )}
              {isHost && (
                <button
                  className="btn btn-primary"
                  disabled={!allReady || players.length < 1}
                  onClick={() => sessionRef.current.startRace(getRandomParagraph())}
                >
                  Start Race
                </button>
              )}
            </div>
            {isHost && !allReady && (
              <p style={{ textAlign: 'center', color: 'var(--text-low)', fontSize: 13, marginTop: 10 }}>
                Waiting for all players to be ready…
              </p>
            )}
          </div>
        )}

        {stage === STAGE.COUNTDOWN && (
          <Countdown
            targetTime={countdownTarget}
            onComplete={() => {
              setRaceStartTime(countdownTarget)
              setStage(STAGE.RACING)
            }}
          />
        )}

        {stage === STAGE.RACING && (
          <>
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <div className="stat">
                <Timer startTime={raceStartTime} running />
                <span className="stat-label">Time</span>
              </div>
            </div>
            <TypingArea
              target={paragraph}
              name={name}
              onComplete={handleComplete}
              onProgress={handleProgress}
            />
            <div style={{ marginTop: 28 }}>
              <Leaderboard players={players} mode="live" selfId={selfId} />
            </div>
          </>
        )}

        {stage === STAGE.RESULTS && finalResults && (
          <div>
            <Confetti />
            <Leaderboard players={finalResults} mode="final" selfId={selfId} />
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
