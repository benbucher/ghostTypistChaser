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
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [progressValue, setProgressValue] = useState<number>(100);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [decreaseRate, setDecreaseRate] = useState<number>(1);
  const [typedWordState, setTypedWordState] = useState<TypedWordState>({
    targetWord: '',
    typedText: '',
    letterStates: []
  });
  
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
    setDecreaseRate(1.0); // Start with consistent initial decrease rate
    setCurrentLevel(1);
    
    // Set random word
    const newWord = getRandomWord();
    setCurrentWord(newWord);
    
    // Reset typed word state
    setTypedWordState({
      targetWord: newWord.toLowerCase(),
      typedText: '',
      letterStates: Array(newWord.length).fill('pending')
    });
    
    // Start timers
    startProgressDecrease();
    updateGameTimer();
  };
  
  // End the game
  const endGame = () => {
    // Save final score before changing game state
    const finalScoreValue = currentScore;
    setFinalScore(finalScoreValue);
    
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
    if (finalScoreValue > highScore) {
      setHighScore(finalScoreValue);
      saveHighScore(finalScoreValue);
      saveHighScoreToServer(finalScoreValue);
    }
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
  
  // Update game timer with deterministic difficulty increase
  const updateGameTimer = () => {
    if (gameTimerRef.current) {
      window.clearInterval(gameTimerRef.current);
    }
    
    gameTimerRef.current = window.setInterval(() => {
      setGameTime((prev) => {
        const newTime = prev + 1;
        
        // Deterministic difficulty increase every 20 seconds
        // At 20s: 1.0 -> 1.5
        // At 40s: 1.5 -> 2.0
        // At 60s: 2.0 -> 2.5, etc.
        if (newTime % difficultyIncreaseInterval === 0) {
          const levelNumber = Math.floor(newTime / difficultyIncreaseInterval);
          const newDecreaseRate = 1.0 + (levelNumber * 0.5);
          
          setDecreaseRate(newDecreaseRate);
          setCurrentLevel(levelNumber + 1);
        }
        
        return newTime;
      });
    }, 1000);
  };
  
  // Calculate correct characters
  const calculateCorrectChars = (typed: string, target: string): number => {
    let correctChars = 0;
    
    for (let i = 0; i < typed.length && i < target.length; i++) {
      if (typed[i] === target[i]) {
        correctChars++;
      }
    }
    
    return correctChars;
  };

  // Handle typing
  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return;
    
    const typedText = e.target.value.toLowerCase();
    const targetWord = currentWord.toLowerCase();
    
    // Update the typed word state for visualization
    const letterStates = targetWord.split('').map((letter, index) => {
      if (index >= typedText.length) return 'pending';
      return typedText[index] === letter ? 'correct' : 'incorrect';
    });
    
    setTypedWordState({
      targetWord,
      typedText,
      letterStates
    });
    
    // Move to next word when the length matches
    if (typedText.length >= targetWord.length) {
      // Count correct characters
      const correctChars = calculateCorrectChars(typedText, targetWord);
      
      // Add points for correct characters
      setCurrentScore(prev => prev + correctChars);
      
      // Calculate progress recovery based on accuracy
      const accuracy = correctChars / targetWord.length;
      let progressRecovery = accuracy * 8; // Base recovery scaled by accuracy
      
      // Perfect match bonus
      if (typedText === targetWord) {
        progressRecovery += 3; // Bonus for perfect word
      }
      
      // Push back the ghost based on accuracy
      setProgressValue(prev => Math.min(100, prev + progressRecovery));
      
      // Get a new word
      const newWord = getRandomWord();
      setCurrentWord(newWord);
      
      // Reset typed word state
      setTypedWordState({
        targetWord: newWord.toLowerCase(),
        typedText: '',
        letterStates: Array(newWord.length).fill('pending')
      });
      
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
    restartGame,
    typedWordState
  };
}
