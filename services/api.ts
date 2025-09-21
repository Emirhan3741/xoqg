// Firebase API services for trivia game

// Mock Firebase callable functions for now
// In production, these would be actual Firebase callable functions

interface GetBoardQuestionsRequest {
  uid: string;
  categories: string[];
  locale: string;
  difficultyBand?: { min: number; max: number };
  perCategory: number;
}

interface GetBoardQuestionsResponse {
  questions: {
    qid: string;
    prompt: string;
    options: string[];
    category: string;
    difficulty: number;
  }[];
}

interface SubmitMoveRequest {
  matchId: string;
  uid: string;
  cellIndex: number;
  selectedText: string;
}

interface SubmitMoveResponse {
  success: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  gameStatus: 'active' | 'finished';
  winner?: string;
}

// Mock implementation - replace with actual Firebase callable functions
export const getBoardQuestions = async (request: GetBoardQuestionsRequest): Promise<GetBoardQuestionsResponse> => {
  if (!request.uid?.trim() || !request.categories?.length || !request.locale?.trim()) {
    throw new Error('Invalid request parameters');
  }
  console.log('getBoardQuestions called with:', request);
  
  // Mock response with Turkish questions
  const mockQuestions = [
    {
      qid: 'q1',
      prompt: 'Türkiye\'nin başkenti neresidir?',
      options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
      category: 'coğrafya',
      difficulty: 1
    },
    {
      qid: 'q2', 
      prompt: 'Futbolda bir takımda kaç oyuncu sahada bulunur?',
      options: ['10', '11', '12', '9'],
      category: 'spor',
      difficulty: 1
    },
    {
      qid: 'q3',
      prompt: 'Mona Lisa tablosunu kim yapmıştır?',
      options: ['Picasso', 'Leonardo da Vinci', 'Van Gogh', 'Michelangelo'],
      category: 'sanat',
      difficulty: 2
    },
    {
      qid: 'q4',
      prompt: 'Osmanlı İmparatorluğu hangi yılda kurulmuştur?',
      options: ['1299', '1453', '1326', '1389'],
      category: 'tarih',
      difficulty: 3
    },
    {
      qid: 'q5',
      prompt: 'Işığın hızı saniyede kaç kilometredir?',
      options: ['300.000 km', '299.792.458 km', '250.000 km', '350.000 km'],
      category: 'bilim',
      difficulty: 4
    },
    {
      qid: 'q6',
      prompt: 'İlk bilgisayar hangi yılda icat edilmiştir?',
      options: ['1940', '1946', '1950', '1955'],
      category: 'teknoloji',
      difficulty: 3
    },
    {
      qid: 'q7',
      prompt: 'Titanic filmi hangi yılda çekilmiştir?',
      options: ['1995', '1997', '1999', '2000'],
      category: 'eğlence',
      difficulty: 2
    },
    {
      qid: 'q8',
      prompt: 'Yunus Emre hangi dönemde yaşamıştır?',
      options: ['13. yüzyıl', '14. yüzyıl', '15. yüzyıl', '12. yüzyıl'],
      category: 'edebiyat',
      difficulty: 3
    },
    {
      qid: 'q9',
      prompt: 'Dünyanın en büyük okyanusı hangisidir?',
      options: ['Atlantik', 'Pasifik', 'Hint', 'Arktik'],
      category: 'coğrafya',
      difficulty: 1
    }
  ];
  
  return { questions: mockQuestions };
};

export const submitMove = async (request: SubmitMoveRequest): Promise<SubmitMoveResponse> => {
  if (!request.matchId?.trim() || !request.uid?.trim() || !request.selectedText?.trim()) {
    throw new Error('Invalid request parameters');
  }
  console.log('submitMove called with:', request);
  
  // Mock correct answers for demo
  const correctAnswers: Record<string, string> = {
    'q1': 'Ankara',
    'q2': '11',
    'q3': 'Leonardo da Vinci',
    'q4': '1299',
    'q5': '299.792.458 km',
    'q6': '1946',
    'q7': '1997',
    'q8': '14. yüzyıl',
    'q9': 'Pasifik'
  };
  
  // Extract question ID from cell index (mock logic)
  const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];
  const questionId = questionIds[request.cellIndex] || 'q1';
  const correctAnswer = correctAnswers[questionId];
  const isCorrect = request.selectedText === correctAnswer;
  
  return {
    success: true,
    isCorrect,
    correctAnswer,
    gameStatus: 'active',
  };
};

// CSV Import function (admin only)
export const processQuestionCsv = async (storagePath: string) => {
  if (!storagePath?.trim()) {
    throw new Error('Invalid storage path');
  }
  console.log('processQuestionCsv called with:', storagePath);
  // This would be implemented as a Cloud Function
  return {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };
};