import { useState, useEffect, useRef, ChangeEvent } from "react";
import { getRandomWord, saveHighScore, loadHighScore } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type GameState = 'idle' | 'playing' | 'gameOver';

// For tracking typing state and displaying correct/incorrect letters
export interface TypedWordState {
  targetWord: string;
  typedText: string;
  letterStates: ('correct' | 'incorrect' | 'pending')[];
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [gameData, setGameData] = useState({
    currentWord: '',
    currentScore: 0,
    highScore: 0,
    gameTime: 0,
    currentLevel: 1,
    progressValue: 100,
    finalScore: 0,
    decreaseRate: 1
  });
  const [typedWordState, setTypedWordState] = useState<TypedWordState>({
    targetWord: '',
    typedText: '',
    letterStates: []
  });
  
  const timerRef = useRef<{ progress: number | null; game: number | null }>({
    progress: null,
    game: null
  });
  
  // Load high score on initial render
  useEffect(() => {
    const localHighScore = loadHighScore();
    setGameData(prev => ({ ...prev, highScore: localHighScore }));
    fetchHighScore();
  }, []);

  const fetchHighScore = async () => {
    try {
      const response = await apiRequest('GET', '/api/highscore', undefined);
      const data = await response.json();
      
      if (data.highScore > gameData.highScore) {
        setGameData(prev => ({ ...prev, highScore: data.highScore }));
        saveHighScore(data.highScore);
      }
    } catch (error) {
      console.error('Failed to fetch high score:', error);
    }
  };
  
  const saveHighScoreToServer = async (score: number) => {
    try {
      await apiRequest('POST', '/api/highscore', { score });
      queryClient.invalidateQueries({ queryKey: ['/api/highscore'] });
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  };

  const clearTimers = () => {
    if (timerRef.current.progress) {
      window.clearInterval(timerRef.current.progress);
      timerRef.current.progress = null;
    }
    if (timerRef.current.game) {
      window.clearInterval(timerRef.current.game);
      timerRef.current.game = null;
    }
  };

  // Start the game
  const startGame = () => {
    clearTimers();
    const newWord = getRandomWord();
    
    setGameState('playing');
    setGameData({
      currentWord: newWord,
      currentScore: 0,
      highScore: gameData.highScore,
      gameTime: 0,
      currentLevel: 1,
      progressValue: 100,
      finalScore: 0,
      decreaseRate: 1.0
    });
    
    setTypedWordState({
      targetWord: newWord.toLowerCase(),
      typedText: '',
      letterStates: Array(newWord.length).fill('pending')
    });
    
    startProgressDecrease();
    updateGameTimer();
  };
  
  // End the game
  const endGame = () => {
    const finalScoreValue = gameData.currentScore;
    
    setGameState('gameOver');
    setGameData(prev => ({ ...prev, finalScore: finalScoreValue }));
    clearTimers();
    
    if (finalScoreValue > gameData.highScore) {
      setGameData(prev => ({ ...prev, highScore: finalScoreValue }));
      saveHighScore(finalScoreValue);
      saveHighScoreToServer(finalScoreValue);
    }
  };
  
  // Start decreasing progress
  const startProgressDecrease = () => {
    timerRef.current.progress = window.setInterval(() => {
      setGameData(prev => {
        const newValue = prev.progressValue - prev.decreaseRate / 5;
        
        if (newValue <= 0) {
          endGame();
          return { ...prev, progressValue: 0 };
        }
        
        return { ...prev, progressValue: newValue };
      });
    }, 100);
  };
  
  // Update game timer with deterministic difficulty increase
  const updateGameTimer = () => {
    timerRef.current.game = window.setInterval(() => {
      setGameData(prev => {
        const newTime = prev.gameTime + 1;
        const levelNumber = Math.floor(newTime / 20);
        const newDecreaseRate = 1.0 + (levelNumber * 0.5);
        
        return {
          ...prev,
          gameTime: newTime,
          currentLevel: levelNumber,
          decreaseRate: newDecreaseRate
        };
      });
    }, 1000);
  };

  // Handle typing
  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const typedText = e.target.value.toLowerCase();
    const targetWord = gameData.currentWord.toLowerCase();
    
    const letterStates = targetWord.split('').map((letter, index) => {
      if (index >= typedText.length) return 'pending';
      return typedText[index] === letter ? 'correct' : 'incorrect';
    });
    
    setTypedWordState({
      targetWord,
      typedText,
      letterStates
    });
    
    if (typedText.length >= targetWord.length) {
      const correctChars = typedText.split('').filter((char, i) => char === targetWord[i]).length;
      const accuracy = correctChars / targetWord.length;
      const progressRecovery = accuracy * 8 + (typedText === targetWord ? 3 : 0);
      
      setGameData(prev => ({
        ...prev,
        currentScore: prev.currentScore + correctChars,
        progressValue: Math.min(100, prev.progressValue + progressRecovery)
      }));
      
      const newWord = getRandomWord();
      setGameData(prev => ({ ...prev, currentWord: newWord }));
      setTypedWordState({
        targetWord: newWord.toLowerCase(),
        typedText: '',
        letterStates: Array(newWord.length).fill('pending')
      });
      
      e.target.value = '';
    }
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return clearTimers;
  }, []);
  
  return {
    gameState,
    currentWord: gameData.currentWord,
    currentScore: gameData.currentScore,
    highScore: gameData.highScore,
    gameTime: gameData.gameTime,
    currentLevel: gameData.currentLevel,
    progressValue: gameData.progressValue,
    finalScore: gameData.finalScore,
    handleTyping,
    startGame,
    restartGame: startGame,
    typedWordState
  };
}
