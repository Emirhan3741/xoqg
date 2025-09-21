import { useState, useCallback } from 'react';
import { openAIService } from '../services/openai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const useOpenAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ChatGPT ile sohbet
  const chat = useCallback(async (messages: ChatMessage[]): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await openAIService.chat(messages);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Soru üretme
  const generateQuestions = useCallback(async (category: string, difficulty: string, count: number = 5) => {
    setLoading(true);
    setError(null);

    try {
      const questions = await openAIService.generateQuestions(category, difficulty, count);
      return questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Soru üretme hatası';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Performans analizi
  const analyzePerformance = useCallback(async (gameStats: any): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await openAIService.analyzePerformance(gameStats);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analiz hatası';
      setError(errorMessage);
      return 'Analiz şu anda yapılamıyor.';
    } finally {
      setLoading(false);
    }
  }, []);

  // Bot hamlesi
  const getBotMove = useCallback(async (gameState: any): Promise<number> => {
    setLoading(true);
    setError(null);

    try {
      const move = await openAIService.getBotMove(gameState);
      return move;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bot hamlesi hatası';
      setError(errorMessage);
      return Math.floor(Math.random() * 9);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    chat,
    generateQuestions,
    analyzePerformance,
    getBotMove,
  };
};
