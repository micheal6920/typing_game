import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayerNameModal from '../components/PlayerNameModal.jsx'
import DifficultySelect from '../components/DifficultySelect.jsx'
import Countdown from '../components/Countdown.jsx'
import TypingArea from '../components/TypingArea.jsx'
import Timer from '../components/Timer.jsx'
import ResultCard from '../components/ResultCard.jsx'
import { getLastName, setLastName, addHistoryEntry } from '../services/storage.js'
import { DIFFICULTIES } from '../utils/wordLists.js'

const STAGE = { NAME: 'name', DIFFICULTY: 'difficulty', COUNTDOWN: 'countdown', TYPING: 'typing', RESULT: 'result' }

export default function SinglePlayer() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(STAGE.NAME)
  const [name, setName] = useState(getLastName())
  const [difficultyKey, setDifficultyKey] = useState('easy')
  const [raceStartTime, setRaceStartTime] = useState(null)
  const [result, setResult] = useState(null)

  const difficulty = DIFFICULTIES[difficultyKey]

  function handleNameSubmit(submittedName) {
    setName(submittedName)
    setLastName(submittedName)
    setStage(STAGE.DIFFICULTY)
  }

  function handleDifficultySelect(key) {
    setDifficultyKey(key)
    setStage(STAGE.COUNTDOWN)
  }

  function handleCountdownComplete() {
    setRaceStartTime(Date.now())
    setStage(STAGE.TYPING)
  }

  // Stable reference so TypingArea's effects don't re-subscribe needlessly
  const handleComplete = useCallback(
    (typedResult) => {
      const withMode = { ...typedResult, difficultyLabel: difficulty.label }
      setResult(withMode)
      addHistoryEntry({ mode: 'single', difficulty: difficulty.key, ...typedResult })
      setStage(STAGE.RESULT)
    },
    [difficulty]
  )

  function handleTryAgain() {
    setResult(null)
    setStage(STAGE.COUNTDOWN)
  }

  function handleChangeDifficulty() {
    setResult(null)
    setStage(STAGE.DIFFICULTY)
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

        {stage === STAGE.DIFFICULTY && <DifficultySelect onSelect={handleDifficultySelect} />}

        {stage === STAGE.COUNTDOWN && <Countdown onComplete={handleCountdownComplete} />}

        {stage === STAGE.TYPING && (
          <>
            <div className="stat-row" style={{ marginBottom: 10 }}>
              <div className="stat">
                <Timer startTime={raceStartTime} running durationSeconds={difficulty.seconds} />
                <span className="stat-label">
                  {difficulty.icon} {difficulty.label} · Time left
                </span>
              </div>
            </div>
            <TypingArea
              name={name}
              onComplete={handleComplete}
              timedConfig={{
                durationSeconds: difficulty.seconds,
                wordList: difficulty.words,
                startTime: raceStartTime,
              }}
            />
          </>
        )}

        {stage === STAGE.RESULT && result && (
          <ResultCard
            result={result}
            onTryAgain={handleTryAgain}
            onHome={() => navigate('/')}
            onChangeDifficulty={handleChangeDifficulty}
          />
        )}
      </div>
    </div>
  )
}
