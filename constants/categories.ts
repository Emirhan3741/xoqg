import { QuestionCategory } from '@/types/game';

export const CATEGORY_CONFIG: Record<QuestionCategory, {
  name: string;
  color: string;
  lightColor: string;
  icon: string;
}> = {
  spor: {
    name: 'Spor',
    color: '#22C55E',
    lightColor: '#DCFCE7',
    icon: '⚽'
  },
  tarih: {
    name: 'Tarih',
    color: '#A16207',
    lightColor: '#FEF3C7',
    icon: '🏛️'
  },
  coğrafya: {
    name: 'Coğrafya',
    color: '#3B82F6',
    lightColor: '#DBEAFE',
    icon: '🌍'
  },
  bilim: {
    name: 'Bilim',
    color: '#8B5CF6',
    lightColor: '#EDE9FE',
    icon: '🔬'
  },
  sanat: {
    name: 'Sanat',
    color: '#EF4444',
    lightColor: '#FEE2E2',
    icon: '🎨'
  },
  eğlence: {
    name: 'Eğlence',
    color: '#EAB308',
    lightColor: '#FEF3C7',
    icon: '🎬'
  },
  teknoloji: {
    name: 'Teknoloji',
    color: '#10B981',
    lightColor: '#D1FAE5',
    icon: '💻'
  },
  edebiyat: {
    name: 'Edebiyat',
    color: '#F59E0B',
    lightColor: '#FEF3C7',
    icon: '📚'
  },
  'genel kültür': {
    name: 'Genel Kültür',
    color: '#6366F1',
    lightColor: '#E0E7FF',
    icon: '🧠'
  },
  'yabancı dil': {
    name: 'Yabancı Dil',
    color: '#EC4899',
    lightColor: '#FCE7F3',
    icon: '🌐'
  }
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG) as QuestionCategory[];

// For random category assignment to board cells
export const getRandomCategories = (count: number = 9): QuestionCategory[] => {
  const categories = [...CATEGORIES];
  const result: QuestionCategory[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * categories.length);
    result.push(categories[randomIndex]);
  }
  
  return result;
};