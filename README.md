# X-O Quiz Game 🎯

React Native ve Expo ile geliştirilmiş, ChatGPT entegrasyonlu akıllı quiz oyunu.

## 🚀 Özellikler

- **Tek Oyuncu Modu**: Karışık kategorilerle pratik yapın
- **Çok Oyunculu Mod**: Gerçek zamanlı eşleşme sistemi
- **AI Bot Oyunu**: ChatGPT destekli akıllı bot ile X-O oynayın
- **AI Soru Üreticisi**: ChatGPT ile otomatik soru üretimi
- **Firebase Entegrasyonu**: Gerçek zamanlı veritabanı ve authentication
- **Performans Analizi**: AI destekli oyuncu performans değerlendirmesi

## 🛠️ Teknolojiler

- **Frontend**: React Native, Expo Router
- **Backend**: Firebase (Firestore, Functions, Auth)
- **AI Integration**: OpenAI ChatGPT API
- **State Management**: Zustand
- **Styling**: NativeWind, Linear Gradients

## 📱 Kurulum

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/[kullanici-adi]/x-o-quiz-game.git
   cd x-o-quiz-game
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Konfigürasyon:**
   - `config.ts` dosyasında OpenAI API key'inizi ekleyin
   - Firebase konfigürasyonunu yapın

4. **Uygulamayı çalıştırın:**
   ```bash
   npm start
   ```

## 🔧 API Konfigürasyonu

### OpenAI API
```typescript
// config.ts
export const OPENAI_CONFIG = {
  apiKey: 'your_openai_api_key_here',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
};
```

### Firebase Konfigürasyonu
Firebase console'dan aldığınız config'i `services/firebase.ts` dosyasına ekleyin.

## 🎮 Oyun Modları

### 1. Tek Oyuncu
- Karışık kategorilerden sorular
- Kişisel istatistik takibi
- Zorluk seviyesi seçimi

### 2. Çok Oyunculu
- Gerçek zamanlı eşleşme
- 3x3 quiz tahtası
- Sırayla soru çözme sistemi

### 3. AI Bot Oyunu
- ChatGPT destekli akıllı hamle yapma
- X-O oyunu mekaniği
- Stratejik bot davranışı

### 4. AI Soru Üreticisi
- Kategori bazlı soru üretimi
- Zorluk seviyesi ayarı
- Otomatik doğru cevap belirleme

## 🔥 Firebase Yapısı

```
/games/{gameId}
├── players[]
├── board[]
├── currentPlayer
├── status
└── createdAt

/users/{userId}
├── displayName
├── stats
└── gameHistory[]
```

## 📊 AI Özellikleri

### Bot Hamlesi Algoritması
- Mevcut oyun durumunu analiz eder
- En optimal hamleyi ChatGPT ile belirler
- Geçersiz hamle durumunda fallback stratejisi

### Soru Üretme Sistemi
- Kategori ve zorluk bazlı prompt engineering
- JSON formatında yapılandırılmış çıktı
- Otomatik doğrulama ve hata yönetimi

### Performans Analizi
- Oyuncu istatistiklerini AI ile değerlendirir
- Kişiselleştirilmiş gelişim önerileri
- Türkçe motivasyonel geri bildirim

## 🚀 Deployment

### Expo Build
```bash
expo build:web
```

### Firebase Hosting
```bash
firebase deploy
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

- **AI Integration**: OpenAI ChatGPT API
- **Real-time Features**: Firebase Firestore
- **Mobile Development**: React Native & Expo

---

🎯 **Akıllı quiz deneyimi için hazır!**