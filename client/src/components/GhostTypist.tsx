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
      {/* Header */}
      <div className="text-center w-full py-4">
        <h1 className="text-2xl font-semibold text-primary">Ghost Typist</h1>
      </div>

      {/* Score Display */}
      <div className="w-full mb-4">
        <div className="flex justify-between mb-2">
          <div className="text-sm font-medium text-primary">
            High Score: <span>{highScore}</span>
          </div>
          <div className="text-sm font-medium text-primary">
            Time: <span>{gameTime}</span>s
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-sm font-medium text-primary">
            Current Score: <span>{currentScore}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {/* Progress Bar */}
        <div className="w-full h-5 bg-gray-200 rounded-full mb-8">
          <div
            className={`h-5 bg-primary rounded-full transition-all duration-300 ${progressValue <= 30 ? "bg-opacity-80" : ""}`}
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>

        {/* Ghost Display */}
        <div className="flex justify-center items-center mb-8">
          <GhostImage className="w-32 h-32 opacity-90" />
        </div>

        {/* Word Display */}
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold mb-6 text-primary">
            {currentWord}
          </div>
        </div>

        {/* Typing Input */}
        <div className="w-full max-w-md mb-8">
          <Input
            ref={inputRef}
            type="text"
            className="w-full p-3 text-lg rounded border-2 border-primary bg-background text-primary transition-all"
            placeholder="Start typing here..."
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
            <h2 className="text-xl font-semibold mb-2 text-primary">
              Game Over!
            </h2>
            <p className="text-primary mb-4">The ghost caught you!</p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-white bg-opacity-50 p-3 rounded text-primary">
                <div className="font-medium">Final Score</div>
                <div className="text-lg font-semibold">{finalScore}</div>
              </div>
              <div className="bg-white bg-opacity-50 p-3 rounded text-primary">
                <div className="font-medium">Survived</div>
                <div className="text-lg font-semibold">{gameTime}s</div>
              </div>
            </div>
            <Button
              className="bg-primary text-background font-medium py-3 px-8 rounded-full hover:bg-opacity-90 transition-all text-lg"
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
  );
}
