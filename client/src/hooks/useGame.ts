import { useState, useEffect, useRef, ChangeEvent } from "react";
import { getRandomWord, saveHighScore, loadHighScore } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type GameState = 'idle' | 'playing' | 'gameOver';

export function useGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [progressValue, setProgressValue] = useState<number>(100);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [decreaseRate, setDecreaseRate] = useState<number>(1);
  
  const progressDecreaseTimerRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);
  const difficultyIncreaseInterval = 20; // seconds
  
  // Load high score on initial render
  useEffect(() => {
    setHighScore(loadHighScore());
    fetchHighScore();
  }, []);

  const fetchHighScore = async () => {
    try {
      const response = await apiRequest('GET', '/api/highscore', undefined);
      const data = await response.json();
      
      // Only update if server high score is higher than local
      if (data.highScore > loadHighScore()) {
        setHighScore(data.highScore);
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

  // Start the game
  const startGame = () => {
    // Reset game state
    setGameState('playing');
    setCurrentScore(0);
    setGameTime(0);
    setProgressValue(100);
    setDecreaseRate(2); // Start with a higher decrease rate
    setCurrentLevel(1);
    
    // Set random word
    setCurrentWord(getRandomWord());
    
    // Start timers
    startProgressDecrease();
    updateGameTimer();
  };
  
  // End the game
  const endGame = () => {
    setGameState('gameOver');
    
    // Clear timers
    if (progressDecreaseTimerRef.current) {
      window.clearInterval(progressDecreaseTimerRef.current);
      progressDecreaseTimerRef.current = null;
    }
    
    if (gameTimerRef.current) {
      window.clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    
    // Update high score if needed
    if (currentScore > highScore) {
      setHighScore(currentScore);
      saveHighScore(currentScore);
      saveHighScoreToServer(currentScore);
    }
    
    // Set final score
    setFinalScore(currentScore);
  };
  
  // Restart the game
  const restartGame = () => {
    startGame();
  };
  
  // Start decreasing progress
  const startProgressDecrease = () => {
    if (progressDecreaseTimerRef.current) {
      window.clearInterval(progressDecreaseTimerRef.current);
    }
    
    progressDecreaseTimerRef.current = window.setInterval(() => {
      setProgressValue((prev) => {
        const newValue = prev - decreaseRate / 5; // Faster decrease (5 updates per second)
        
        if (newValue <= 0) {
          endGame();
          return 0;
        }
        
        return newValue;
      });
    }, 100);
  };
  
  // Update game timer
  const updateGameTimer = () => {
    if (gameTimerRef.current) {
      window.clearInterval(gameTimerRef.current);
    }
    
    gameTimerRef.current = window.setInterval(() => {
      setGameTime((prev) => {
        const newTime = prev + 1;
        
        // Increase difficulty every difficultyIncreaseInterval seconds
        if (newTime % difficultyIncreaseInterval === 0) {
          setDecreaseRate((prevRate) => prevRate + 0.5);
          setCurrentLevel((prevLevel) => prevLevel + 1);
        }
        
        return newTime;
      });
    }, 1000);
  };
  
  // Handle typing
  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const typedText = e.target.value.trim().toLowerCase();
    const targetWord = currentWord.toLowerCase();
    
    // If the word is correct
    if (typedText === targetWord) {
      // Increase score (add the number of characters)
      setCurrentScore((prev) => prev + targetWord.length);
      
      // Push back the ghost (reduced from 10 to 8 to make it harder)
      setProgressValue((prev) => Math.min(100, prev + 8));
      
      // Get a new word
      setCurrentWord(getRandomWord());
      
      // Clear input
      e.target.value = '';
    }
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (progressDecreaseTimerRef.current) {
        window.clearInterval(progressDecreaseTimerRef.current);
      }
      
      if (gameTimerRef.current) {
        window.clearInterval(gameTimerRef.current);
      }
    };
  }, []);
  
  return {
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
    restartGame
  };
}
