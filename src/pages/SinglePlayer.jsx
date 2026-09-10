import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayerNameModal from '../components/PlayerNameModal.jsx'
import Countdown from '../components/Countdown.jsx'
import TypingArea from '../components/TypingArea.jsx'
import Timer from '../components/Timer.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { getLastName, setLastName, addHistoryEntry } from '../services/storage.js'
import { getRandomParagraph } from '../utils/paragraphs.js'

const STAGE = { NAME: 'name', COUNTDOWN: 'countdown', TYPING: 'typing', RESULT: 'result' }

export default function SinglePlayer() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(STAGE.NAME)
  const [name, setName] = useState(getLastName())
  const [paragraph, setParagraph] = useState(getRandomParagraph())
  const [raceStartTime, setRaceStartTime] = useState(null)
  const [result, setResult] = useState(null)

  function handleNameSubmit(submittedName) {
    setName(submittedName)
    setLastName(submittedName)
    setStage(STAGE.COUNTDOWN)
  }

  function handleCountdownComplete() {
    setRaceStartTime(Date.now())
    setStage(STAGE.TYPING)
  }

  // Stable reference so TypingArea's effects don't re-subscribe needlessly
  const handleComplete = useCallback((typedResult) => {
    setResult(typedResult)
    addHistoryEntry({ mode: 'single', ...typedResult })
    setStage(STAGE.RESULT)
  }, [])

  function handleTryAgain() {
    setParagraph(getRandomParagraph())
    setResult(null)
    setStage(STAGE.COUNTDOWN)
  }

  return (
    <div className="page">
      <div className="page-inner">
        {stage === STAGE.NAME && (
          <PlayerNameModal
            title="Single Player"
            defaultName={name}
            buttonLabel="Start"
            onSubmit={handleNameSubmit}
          />
        )}

        {stage === STAGE.COUNTDOWN && <Countdown onComplete={handleCountdownComplete} />}

        {stage === STAGE.TYPING && (
          <>
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <div className="stat">
                <Timer startTime={raceStartTime} running />
                <span className="stat-label">Time</span>
              </div>
            </div>
            <TypingArea target={paragraph} name={name} onComplete={handleComplete} />
          </>
        )}

        {stage === STAGE.RESULT && result && (
          <ResultCard result={result} onTryAgain={handleTryAgain} onHome={() => navigate('/')} />
        )}
      </div>
    </div>
  )
}
