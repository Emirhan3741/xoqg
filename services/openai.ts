import { OPENAI_CONFIG } from '../config';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = OPENAI_CONFIG.apiKey;
  }

  // ChatGPT ile sohbet etme
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages,
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API hatası: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data.choices[0]?.message?.content || 'Yanıt alınamadı';
    } catch (error) {
      console.error('ChatGPT API hatası:', error);
      throw error;
    }
  }

  // Oyun için soru üretme
  async generateQuestions(category: string, difficulty: string, count: number = 5): Promise<any[]> {
    const prompt = `${category} kategorisinde ${difficulty} seviyesinde ${count} adet çoktan seçmeli soru üret. 
    Her soru şu formatta olsun:
    {
      "question": "Soru metni",
      "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
      "correct": 0,
      "category": "${category}",
      "difficulty": "${difficulty}"
    }
    
    Sadece JSON array formatında yanıt ver, başka metin ekleme.`;

    try {
      const response = await this.chat([
        { role: 'system', content: 'Sen bir soru üretme asistanısın. Sadece JSON formatında yanıt veriyorsun.' },
        { role: 'user', content: prompt }
      ]);

      return JSON.parse(response);
    } catch (error) {
      console.error('Soru üretme hatası:', error);
      return [];
    }
  }

  // Oyuncu performansı analizi
  async analyzePerformance(gameStats: any): Promise<string> {
    const prompt = `Bu oyuncu istatistiklerini analiz et ve gelişim önerileri ver:
    ${JSON.stringify(gameStats)}
    
    Türkçe olarak kısa ve motive edici bir analiz yap.`;

    try {
      return await this.chat([
        { role: 'system', content: 'Sen bir oyun koçusun. Oyuncuların performansını analiz edip motive edici öneriler veriyorsun.' },
        { role: 'user', content: prompt }
      ]);
    } catch (error) {
      console.error('Performans analizi hatası:', error);
      return 'Analiz şu anda yapılamıyor.';
    }
  }

  // Akıllı rakip (AI bot)
  async getBotMove(gameState: any): Promise<number> {
    const prompt = `Bu X-O oyun durumunda en iyi hamleyi yap:
    ${JSON.stringify(gameState)}
    
    Sadece hamle pozisyonunu (0-8 arası sayı) yanıtla.`;

    try {
      const response = await this.chat([
        { role: 'system', content: 'Sen bir X-O oyunu uzmanısın. En iyi hamleleri yaparsın.' },
        { role: 'user', content: prompt }
      ]);

      const move = parseInt(response.trim());
      return isNaN(move) ? Math.floor(Math.random() * 9) : move;
    } catch (error) {
      console.error('Bot hamlesi hatası:', error);
      return Math.floor(Math.random() * 9);
    }
  }
}

// Singleton instance
export const openAIService = new OpenAIService();
