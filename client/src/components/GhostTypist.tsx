import { useState, useEffect, useRef } from "react";
import GhostImage from "./GhostImage";
import { useGame } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GhostTypist() {
  const {
    gameState,
    currentWord,
    currentScore,
    highScore,
    gameTime,
    currentLevel,
    progressValue,
    finalScore,
    handleTyping,
    startGame,
    restartGame,
    typedWordState
  } = useGame();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when game is playing
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-between fade-in">
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-screen">
        {/* Header + Score Display Combined */}
        <div className="flex justify-between items-center w-full py-4">
          {/* Title */}
          <h1 className="text-4xl text-primary">Ghost Typist</h1>

          {/* Score Display (Column Layout) */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-sm font-medium text-primary">
              High Score: <span>{highScore}</span>
            </div>
            <div className="text-sm font-medium text-primary">
              Score: <span>{currentScore}</span>
            </div>
            <div className="text-sm font-medium text-primary">
              Time: <span>{gameTime}</span>s
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-grow flex flex-col items-center justify-center w-full">

          {/* Ghost Display */}
          <div className="flex justify-center items-center mb-8">
            <GhostImage className="w-48 h-48 opacity-90" />
          </div>

          {/* Progress Bar */}
          <div className="w-full h-5 bg-gray-200 rounded-full mb-8 border-2 border-primary">
            <div
              className={`h-full bg-primary rounded-l-full transition-all duration-300 ${progressValue <= 30 ? "bg-opacity-80" : ""}`}
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>

          {/* Word Display */}
          <div className="mb-4 text-center">
            <div className="text-3xl mb-4 text-primary word-display">
              {typedWordState.letterStates.map((state, index) => (
                <span 
                  key={index} 
                  className={
                    index === typedWordState.typedText.length ? 'current-letter' : 
                    state === 'correct' ? 'correct-letter' : 
                    state === 'incorrect' ? 'incorrect-letter' : ''
                  }
                >
                  {currentWord[index]}
                </span>
              ))}
            </div>
          </div>

          {/* Typing Input */}
          <div className="w-full max-w-md mb-8">
            <Input
              ref={inputRef}
              type="text"
              className="w-full p-3 text-lg rounded border-2 border-primary bg-background text-primary transition-all"
              placeholder="Type here..."
              onChange={handleTyping}
              disabled={gameState !== "playing"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Game Controls */}
          {gameState === "idle" && (
            <Button
              className="bg-primary text-background font-medium py-3 px-8 rounded-full hover:bg-opacity-90 transition-all text-lg mb-4"
              onClick={startGame}
            >
              Start Game
            </Button>
          )}

          {/* Game Over Message */}
          {gameState === "gameOver" && (
            <div className="text-center fade-in">
              <h2 className="text-xl font-semibold mb-1 text-primary">
                Game Over
              </h2>
              <div className="flex justify-center gap-4 mb-4 text-sm">
                <div className="bg-white bg-opacity-50 px-3 py-2 rounded text-primary">
                  <span className="font-medium">Score: </span>
                  <span className="font-semibold">{finalScore}</span>
                </div>
                <div className="bg-white bg-opacity-50 px-3 py-2 rounded text-primary">
                  <span className="font-medium">Time: </span>
                  <span className="font-semibold">{gameTime}s</span>
                </div>
              </div>
              <Button
                className="bg-primary text-background font-medium py-2 px-6 rounded-full hover:bg-opacity-90 transition-all"
                onClick={restartGame}
              >
                Play Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto w-full text-center py-4">
          <p className="text-xs text-primary opacity-70">
            Ghost Typist | Type to survive!
          </p>
        </div>
      </div>
    </div>
  );
}
