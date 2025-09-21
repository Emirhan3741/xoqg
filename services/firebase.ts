// /services/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions, connectFunctionsEmulator } from "firebase/functions";

type Cfg = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  databaseURL?: string;
  functionsRegion?: string;
  functionsEmulator?: string;
};

type RequiredCfg = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
  functionsRegion: string;
  functionsEmulator?: string;
};

// 🔹 Tip: EnvStatus — tüm çağıranlar aynı arayüzü görsün
export type EnvStatus = {
  ok: boolean;
  missing: string[];
  placeholders: string[];
  invalidAppId: boolean;
  snapshot?: Record<string, unknown>;
};

// Configuration source tracking
let _configSource: "env" | "file" | "unknown" = "unknown";
export function configSource() {
  return _configSource;
}

// Load environment variables
const envCfg: Cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  functionsRegion: process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1",
  functionsEmulator: process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR
};

// Fallback configuration from JSON file
let fileCfg: Cfg = {};
try {
  fileCfg = require("./firebase.web.json");
} catch {
  // File doesn't exist, continue with env config
}

function mask(v?: string) {
  if (!v) return "(empty)";
  return v.length <= 6 ? "*".repeat(v.length) : v.slice(0,3) + "****" + v.slice(-3);
}

function isPlaceholder(v?: string) {
  if (!v) return false;
  const upper = v.toUpperCase();
  return upper.includes("REPLACE") || upper.startsWith("YOUR_") || upper === "YOUR_API_KEY";
}

function isValidWebAppId(v?: string) {
  if (!v || typeof v !== 'string' || v.length === 0 || v.length > 200) return false;
  const sanitized = v.trim();
  if (!sanitized) return false;
  return /^\d+:\d+:web:[A-Za-z0-9]+$/.test(sanitized);
}

function hasAllRequired(c: Cfg) {
  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  return required.every(key => !!(c as any)[key]);
}

function pickConfig(): RequiredCfg {
  // Try environment variables first
  if (hasAllRequired(envCfg)) {
    console.log("[Firebase] using .env", {
      apiKey: mask(envCfg.apiKey),
      authDomain: envCfg.authDomain,
      projectId: envCfg.projectId,
      storageBucket: envCfg.storageBucket,
      messagingSenderId: envCfg.messagingSenderId,
      appId: envCfg.appId?.includes(":web:") ? "(web ok)" : envCfg.appId
    });
    _configSource = "env";
    return {
      apiKey: envCfg.apiKey!,
      authDomain: envCfg.authDomain!,
      projectId: envCfg.projectId!,
      storageBucket: envCfg.storageBucket!,
      messagingSenderId: envCfg.messagingSenderId!,
      appId: envCfg.appId!,
      databaseURL: envCfg.databaseURL,
      functionsRegion: envCfg.functionsRegion || "us-central1",
      functionsEmulator: envCfg.functionsEmulator
    };
  }

  // Fallback to JSON file
  if (hasAllRequired(fileCfg)) {
    console.log("[Firebase] using services/firebase.web.json (fallback)", {
      apiKey: mask(fileCfg.apiKey),
      authDomain: fileCfg.authDomain,
      projectId: fileCfg.projectId,
      storageBucket: fileCfg.storageBucket,
      messagingSenderId: fileCfg.messagingSenderId,
      appId: fileCfg.appId?.includes(":web:") ? "(web ok)" : fileCfg.appId
    });
    _configSource = "file";
    return {
      apiKey: fileCfg.apiKey!,
      authDomain: fileCfg.authDomain!,
      projectId: fileCfg.projectId!,
      storageBucket: fileCfg.storageBucket!,
      messagingSenderId: fileCfg.messagingSenderId!,
      appId: fileCfg.appId!,
      databaseURL: fileCfg.databaseURL,
      functionsRegion: fileCfg.functionsRegion || "us-central1",
      functionsEmulator: envCfg.functionsEmulator
    };
  }

  // Neither source has complete config
  const envMissing = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"].filter(key => !(envCfg as any)[key]);
  const fileMissing = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"].filter(key => !(fileCfg as any)[key]);
  
  console.error('[Firebase] Configuration incomplete:', {
    envMissing,
    fileMissing,
    envHas: Object.keys(envCfg).filter(k => (envCfg as any)[k]),
    fileHas: Object.keys(fileCfg).filter(k => (fileCfg as any)[k])
  });
  
  throw new Error(
    `Firebase env not ready: ${envMissing.join(',')} hasPlaceholders: false`
  );
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;
let _storage: FirebaseStorage | null = null;
let _functions: Functions | null = null;

export function getFirebase() {
  const cfg = pickConfig();

  if (!_app) {
    _app = getApps().length ? getApps()[0]! : initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
      ...(cfg.databaseURL ? { databaseURL: cfg.databaseURL } : {})
    });

    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _rtdb = getDatabase(_app);
    _storage = getStorage(_app);
    
    // Initialize Functions with proper region for v2 compatibility
    const region = cfg.functionsRegion || "us-central1";
    _functions = getFunctions(_app, region);
    
    // Connect to emulator only in development and if specified
    if (cfg.functionsEmulator && __DEV__) {
      const [host, portStr] = cfg.functionsEmulator.split(":");
      const port = Number(portStr);
      if (host && Number.isFinite(port)) {
        try {
          connectFunctionsEmulator(_functions, host, port);
          console.log(`[Firebase] Functions emulator connected: ${host}:${port}`);
        } catch (e) {
          console.warn(`[Firebase] Failed to connect to Functions emulator:`, e);
        }
      }
    }
    
    console.log(`[Firebase] Initialized with region: ${region}`);
    console.log(`[Firebase] Functions URL:`, (_functions as any)?._url);
    console.log(`[Firebase] Functions region:`, (_functions as any)?._region);
  }

  return { app: _app!, auth: _auth!, db: _db!, rtdb: _rtdb!, storage: _storage!, functions: _functions! };
}

// 🔹 Eski çağrılar için geriye dönük uyumluluk
export function isEnvReady(): boolean {
  return envStatus().ok;
}

// 🔹 Zaten yazdığın envStatus() fonksiyonunun imzası böyle dönsün
export function envStatus(): EnvStatus {
  try {
    const config = pickConfig();
    
    // Check for placeholder values
    const placeholders = Object.entries(config)
      .filter(([, v]) => isPlaceholder(v as string))
      .map(([k]) => k);
    
    // Check app ID format
    const invalidAppId = !isValidWebAppId(config.appId);
    
    if (placeholders.length > 0 || invalidAppId) {
      return { 
        ok: false, 
        missing: [], 
        placeholders, 
        invalidAppId, 
        snapshot: {
          apiKey: mask(config.apiKey),
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          source: configSource()
        }
      };
    }
    
    return { 
      ok: true, 
      missing: [], 
      placeholders: [], 
      invalidAppId: false, 
      snapshot: {
        apiKey: mask(config.apiKey),
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        source: configSource()
      }
    };
  } catch (error) {
    console.error('[Firebase] Config validation error:', error);
    // Analyze what's missing from both sources
    const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
    const combined = { ...fileCfg, ...envCfg }; // Prioritize env over file
    
    const missing = required.filter(key => !(combined as any)[key]);
    const placeholders = Object.entries(combined)
      .filter(([, v]) => v && isPlaceholder(v as string))
      .map(([k]) => k);
    
    const appId = combined.appId;
    const invalidAppId = !!appId && !isValidWebAppId(appId);
    
    return { 
      ok: false, 
      missing, 
      placeholders, 
      invalidAppId, 
      snapshot: {
        envMissing: missing,
        source: configSource()
      }
    };
  }
}

export async function ensureAnonymousAuth(): Promise<string> {
  const { auth } = getFirebase();
  if (!auth.currentUser) {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  }
  return auth.currentUser!.uid;
}

// Oyun tahtası için soru seçim fonksiyonu - Her çağrıda tamamen farklı sorular
export async function getNewGameQuestions(): Promise<any[]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Soru yükleme zaman aşımına uğradı')), 10000); // 10 saniye timeout
  });
  
  const loadQuestionsPromise = async (): Promise<any[]> => {
    try {
      console.log('Yeni oyun için tamamen farklı sorular yükleniyor...');
      
      // Firebase bağlantısını test et
      let db;
      try {
        const firebase = getFirebase();
        db = firebase.db;
        console.log('Firebase bağlantısı başarılı');
      } catch (firebaseError) {
        console.error('Firebase bağlantı hatası:', firebaseError);
        throw new Error('Firebase bağlantısı kurulamadı');
      }
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      
      console.log('Firestore modülleri yüklendi, sorular aranıyor...');
    
      // Mevcut kategoriler
      const categories = ['spor', 'tarih', 'coğrafya', 'bilim', 'sanat', 'teknoloji', 'genel kültür', 'yabancı dil'];
    
      // 9 kare için rastgele kategoriler seç (tekrar edebilir)
      const selectedCategories: string[] = [];
      for (let i = 0; i < 9; i++) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        selectedCategories.push(randomCategory);
      }
    
      console.log('Seçilen kategoriler:', selectedCategories);
      
      // Önce questions koleksiyonunun var olup olmadığını kontrol et
      try {
        const testQuery = query(collection(db, 'questions'), limit(1));
        const testSnapshot = await getDocs(testQuery);
        console.log('Questions koleksiyonu kontrol edildi, soru sayısı:', testSnapshot.size);
        
        if (testSnapshot.empty) {
          console.warn('Questions koleksiyonu boş, fallback sorular kullanılacak');
          return createFallbackQuestions();
        }
      } catch (collectionError) {
        console.error('Questions koleksiyonuna erişim hatası:', collectionError);
        return createFallbackQuestions();
      }
      
      const gameQuestions: any[] = [];
      const usedQuestionIds = new Set<string>(); // Bu oyun için kullanılan soru ID'leri
    
      // Her kategori için bir soru seç
      for (let i = 0; i < selectedCategories.length; i++) {
        const category = selectedCategories[i];
        let questionFound = false;
        
        try {
          // Bu kategori için tüm soruları al (used durumunu görmezden gel)
          const questionsQuery = query(
            collection(db, 'questions'),
            where('category', '==', category),
            limit(100) // Daha fazla soru al ki seçim şansımız artsın
          );
        
          const querySnapshot = await getDocs(questionsQuery);
        
          if (!querySnapshot.empty) {
            // Bu oyunda henüz kullanılmamış soruları filtrele
            const availableQuestions = querySnapshot.docs.filter(doc => 
              !usedQuestionIds.has(doc.id)
            );
            
            if (availableQuestions.length > 0) {
              // Rastgele bir soru seç
              const randomIndex = Math.floor(Math.random() * availableQuestions.length);
              const selectedDoc = availableQuestions[randomIndex];
              const questionData = selectedDoc.data();
              
              // Soruyu oyun listesine ekle
              gameQuestions.push({
                id: selectedDoc.id,
                category: questionData.category,
                question: questionData.question,
                options: questionData.options || ['A', 'B', 'C', 'D'],
                answer: questionData.answer || 'A'
              });
              
              // Bu soruyu kullanıldı olarak işaretle (sadece bu oyun için)
              usedQuestionIds.add(selectedDoc.id);
              
              questionFound = true;
              console.log(`${category} kategorisinden yeni soru seçildi:`, selectedDoc.id);
            } else {
              console.log(`${category} kategorisinde bu oyun için kullanılabilir soru kalmadı`);
            }
          }
        
          // Eğer bu kategoride soru bulunamadıysa alternatif kategori dene
          if (!questionFound) {
            console.warn(`${category} kategorisinde soru bulunamadı, alternatif kategori deneniyor`);
            
            // Diğer kategorilerden rastgele bir soru al
            const alternativeCategories = categories.filter(cat => cat !== category);
            
            for (const altCategory of alternativeCategories) {
              const altQuery = query(
                collection(db, 'questions'),
                where('category', '==', altCategory),
                limit(50)
              );
              
              const altSnapshot = await getDocs(altQuery);
              
              if (!altSnapshot.empty) {
                // Bu oyunda henüz kullanılmamış soruları filtrele
                const availableAltQuestions = altSnapshot.docs.filter(doc => 
                  !usedQuestionIds.has(doc.id)
                );
                
                if (availableAltQuestions.length > 0) {
                  const randomDoc = availableAltQuestions[Math.floor(Math.random() * availableAltQuestions.length)];
                  const altQuestionData = randomDoc.data();
                  
                  gameQuestions.push({
                    id: randomDoc.id,
                    category: altQuestionData.category,
                    question: altQuestionData.question,
                    options: altQuestionData.options || ['A', 'B', 'C', 'D'],
                    answer: altQuestionData.answer || 'A'
                  });
                  
                  usedQuestionIds.add(randomDoc.id);
                  
                  questionFound = true;
                  console.log(`${category} yerine ${altCategory} kategorisinden yeni soru seçildi:`, randomDoc.id);
                  break;
                }
              }
            }
          }
        
          // Hala soru bulunamadıysa fallback soru ekle
          if (!questionFound) {
            console.warn(`${category} kategorisi için hiçbir soru bulunamadı, fallback soru ekleniyor`);
            const fallbackId = `fallback-${category}-${Date.now()}-${Math.random()}`;
            gameQuestions.push({
              id: fallbackId,
              category: category,
              question: `Bu kategori için soru bulunamadı, farklı kategori seçiniz`,
              options: ['Tekrar Dene', 'Farklı Kategori', 'Oyunu Yenile', 'Ana Menü'],
              answer: 'Tekrar Dene'
            });
            usedQuestionIds.add(fallbackId);
          }
        
        } catch (categoryError) {
          console.error(`${category} kategorisi için soru seçilirken hata:`, categoryError);
          // Hata durumunda fallback soru ekle
          const errorId = `error-${category}-${Date.now()}-${Math.random()}`;
          gameQuestions.push({
            id: errorId,
            category: category,
            question: `Soru yüklenirken hata oluştu, lütfen tekrar deneyin`,
            options: ['Tekrar Dene', 'Farklı Kategori', 'Oyunu Yenile', 'Ana Menü'],
            answer: 'Tekrar Dene'
          });
          usedQuestionIds.add(errorId);
        }
      }
    
      console.log(`Toplam ${gameQuestions.length} farklı soru seçildi`);
      console.log('Seçilen soru ID\'leri:', Array.from(usedQuestionIds));
      return gameQuestions;
    
    } catch (error) {
      console.error('Oyun soruları seçilirken genel hata:', error);
      return createFallbackQuestions();
    }
  };
  
  try {
    return await Promise.race([loadQuestionsPromise(), timeoutPromise]);
  } catch (error) {
    console.error('Soru yükleme hatası veya zaman aşımı:', error);
    return createFallbackQuestions();
  }
}

// Fallback sorular oluşturma fonksiyonu - Her çağrıda farklı sorular
function createFallbackQuestions(): any[] {
  const allFallbackQuestions = [
    // Coğrafya
    { question: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], answer: 'Ankara', category: 'coğrafya' },
    { question: 'Dünyanın en büyük okyanusu hangisidir?', options: ['Atlantik', 'Pasifik', 'Hint', 'Arktik'], answer: 'Pasifik', category: 'coğrafya' },
    { question: 'Hangi ülke en fazla komşuya sahiptir?', options: ['Rusya', 'Çin', 'Brezilya', 'Hindistan'], answer: 'Çin', category: 'coğrafya' },
    { question: 'Dünya\'nın en yüksek dağı hangisidir?', options: ['K2', 'Everest', 'Kangchenjunga', 'Lhotse'], answer: 'Everest', category: 'coğrafya' },
    
    // Spor
    { question: 'Futbolda bir takımda kaç oyuncu sahada bulunur?', options: ['10', '11', '12', '9'], answer: '11', category: 'spor' },
    { question: 'Basketbolda kaç kişi oynar?', options: ['4', '5', '6', '7'], answer: '5', category: 'spor' },
    { question: 'Olimpiyatlar kaç yılda bir düzenlenir?', options: ['2', '3', '4', '5'], answer: '4', category: 'spor' },
    { question: 'Tenis kortunda kaç set oynanır?', options: ['2', '3', '4', '5'], answer: '3', category: 'spor' },
    
    // Sanat
    { question: 'Mona Lisa tablosunu kim yapmıştır?', options: ['Picasso', 'Leonardo da Vinci', 'Van Gogh', 'Michelangelo'], answer: 'Leonardo da Vinci', category: 'sanat' },
    { question: 'Guernica tablosunun sanatçısı kimdir?', options: ['Dalí', 'Picasso', 'Miró', 'Goya'], answer: 'Picasso', category: 'sanat' },
    { question: 'Yıldızlı Gece tablosunu kim yapmıştır?', options: ['Van Gogh', 'Monet', 'Renoir', 'Cezanne'], answer: 'Van Gogh', category: 'sanat' },
    { question: 'David heykeli kimin eseridir?', options: ['Rodin', 'Michelangelo', 'Donatello', 'Bernini'], answer: 'Michelangelo', category: 'sanat' },
    
    // Tarih
    { question: 'Osmanlı İmparatorluğu hangi yılda kurulmuştur?', options: ['1299', '1453', '1326', '1389'], answer: '1299', category: 'tarih' },
    { question: 'İstanbul hangi yılda fethedilmiştir?', options: ['1453', '1461', '1444', '1402'], answer: '1453', category: 'tarih' },
    { question: 'I. Dünya Savaşı hangi yıllar arasında yaşanmıştır?', options: ['1912-1918', '1914-1918', '1913-1919', '1915-1920'], answer: '1914-1918', category: 'tarih' },
    { question: 'Türkiye Cumhuriyeti hangi yılda kurulmuştur?', options: ['1920', '1921', '1922', '1923'], answer: '1923', category: 'tarih' },
    
    // Bilim
    { question: 'Işığın hızı saniyede kaç kilometredir?', options: ['300.000 km', '299.792.458 km', '250.000 km', '350.000 km'], answer: '299.792.458 km', category: 'bilim' },
    { question: 'Hangi gezegen Güneş\'e en yakındır?', options: ['Venüs', 'Mars', 'Merkür', 'Dünya'], answer: 'Merkür', category: 'bilim' },
    { question: 'Su\'nun kimyasal formülü nedir?', options: ['H2O', 'CO2', 'O2', 'H2SO4'], answer: 'H2O', category: 'bilim' },
    { question: 'İnsan vücudunda kaç kemik vardır?', options: ['206', '208', '210', '204'], answer: '206', category: 'bilim' },
    
    // Teknoloji
    { question: 'İlk bilgisayar hangi yılda icat edilmiştir?', options: ['1940', '1946', '1950', '1955'], answer: '1946', category: 'teknoloji' },
    { question: 'İnternet hangi yılda yaygınlaştı?', options: ['1980', '1990', '1995', '2000'], answer: '1990', category: 'teknoloji' },
    { question: 'Apple şirketi hangi yılda kuruldu?', options: ['1974', '1975', '1976', '1977'], answer: '1976', category: 'teknoloji' },
    { question: 'İlk cep telefonu hangi yılda üretildi?', options: ['1973', '1975', '1980', '1983'], answer: '1973', category: 'teknoloji' },
    
    // Edebiyat
    { question: 'Shakespeare\'in en ünlü eseri hangisidir?', options: ['Hamlet', 'Romeo ve Juliet', 'Macbeth', 'Othello'], answer: 'Hamlet', category: 'edebiyat' },
    { question: 'Savaş ve Barış romanının yazarı kimdir?', options: ['Dostoyevski', 'Tolstoy', 'Çehov', 'Gogol'], answer: 'Tolstoy', category: 'edebiyat' },
    { question: 'Kürk Mantolu Madonna\'nın yazarı kimdir?', options: ['Sabahattin Ali', 'Nazım Hikmet', 'Orhan Kemal', 'Yaşar Kemal'], answer: 'Sabahattin Ali', category: 'edebiyat' },
    { question: 'Don Kişot\'un yazarı kimdir?', options: ['Cervantes', 'Lope de Vega', 'Calderón', 'Góngora'], answer: 'Cervantes', category: 'edebiyat' }
  ];
  
  // Her çağrıda farklı 9 soru seç
  const shuffled = [...allFallbackQuestions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 9);
  
  return selected.map((q, index) => ({
    id: `fallback-${index}-${Date.now()}-${Math.random()}`,
    category: q.category,
    question: q.question,
    options: q.options,
    answer: q.answer
  }));
}