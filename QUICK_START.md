# 🚀 Paylora Hızlı Başlangıç Rehberi

## 1️⃣ Sistemi Çalıştırma

```bash
# Bağımlılıkları yükle (ilk kez)
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda: `http://localhost:5173`

---

## 2️⃣ Veritabanı Kurulumu

### Adım 1: Supabase'e Giriş
1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **SQL Editor**'ü açın

### Adım 2: Database Optimizasyonlarını Çalıştır
1. `database_optimizations.sql` dosyasını açın
2. İçeriği kopyalayın
3. SQL Editor'e yapıştırın
4. **Run** butonuna tıklayın
5. ✅ Başarılı mesajını bekleyin

### Adım 3: Mock Data Yükle
1. `mock_data_2months.sql` dosyasını açın
2. İçeriği kopyalayın
3. SQL Editor'e yapıştırın
4. **Run** butonuna tıklayın
5. ✅ Özet raporu kontrol edin:
   ```
   Employees: 10
   Payrolls (Dec 2024): 10
   Payrolls (Jan 2025): 10
   Sales (Dec 2024): 50
   Sales (Jan 2025): 45
   ...
   ```

---

## 3️⃣ Giriş Bilgileri (Mock Data ile)

### Genel Müdür
- **Email**: `ahmet.yilmaz@paylora.com`
- **Şifre**: Supabase'de kendiniz oluşturmalısınız (Auth → Users → Add User)

### İK Müdürü
- **Email**: `ayse.demir@paylora.com`
- **Şifre**: Supabase'de kendiniz oluşturmalısınız

### Çalışan (Örnek)
- **Email**: `mehmet.kaya@paylora.com`
- **Şifre**: Supabase'de kendiniz oluşturmalısınız

**⚠️ Önemli**: Mock data sadece `employees` tablosunu doldurur. Kullanıcıları Supabase Auth'da manuel oluşturmalısınız!

### Kullanıcı Oluşturma:
1. Supabase → **Authentication** → **Users**
2. **Add User** butonuna tıkla
3. Email: `ahmet.yilmaz@paylora.com`
4. Password: `Test123!` (örnek)
5. Email Confirm: ✅ İşaretle
6. **Create User**

---

## 4️⃣ Yeni Özellikler Testi

### 🎉 Toast Notifications
1. Sales sayfasına git
2. Yeni satış ekle veya sil
3. ✅ Sağ üstte yeşil toast mesajı görünür

### 📥 Export Fonksiyonları
1. **Payroll** → **İndir** butonu → PDF raporu indirilir
2. **Sales** → **İndir** butonu → Excel dosyası indirilir
3. **Employees** → **İndir** butonu → Excel dosyası indirilir
4. **Leave Management** → **İndir** butonu → PDF raporu indirilir

### 📊 Mock Data Kontrolü
1. **Dashboard** → Satış grafikleri ve istatistikler görünür
2. **Payroll** → Aralık 2024 ve Ocak 2025 bordroları
3. **Sales** → ~95 satış kaydı
4. **Time Tracking** → Aralık ve Ocak time log'ları
5. **Leave Management** → ~20 izin talebi

---

## 5️⃣ Sorun Giderme

### ❌ "No rows returned" hatası
**Çözüm**: RLS politikalarını kontrol edin
```sql
-- Supabase SQL Editor'de
SELECT * FROM employees;
-- Boş dönüyorsa RLS devre dışı bırakın (geliştirme için)
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
```

### ❌ Export çalışmıyor
**Çözüm**: Tarayıcı konsolunu kontrol edin
```bash
# Terminal'de
npm install xlsx jspdf jspdf-autotable
npm run dev
```

### ❌ Toast görünmüyor
**Çözüm**: react-hot-toast kurulumu
```bash
npm install react-hot-toast
```
`App.jsx`'de `<Toaster />` komponentinin ekli olduğundan emin olun.

### ❌ Mock data yüklenmiyor
**Çözüm**: Unique constraint hatası
- Email adresleri zaten varsa `ON CONFLICT DO NOTHING` çalışır
- Yeni kayıtlar için farklı email'ler kullanın

---

## 6️⃣ Proje Yapısı

```
Paylora/
├── src/
│   ├── components/       # React bileşenleri
│   │   ├── common/       # Ortak bileşenler (Modal, vb.)
│   │   └── layout/       # Header, Sidebar
│   ├── views/            # Sayfa bileşenleri
│   │   ├── Dashboard.jsx
│   │   ├── Employees.jsx
│   │   ├── Payroll.jsx
│   │   ├── Sales.jsx
│   │   ├── LeaveManagement.jsx
│   │   └── ...
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── toast.js      # Toast notifications
│   │   ├── exportUtils.js # Export fonksiyonları
│   │   └── avatarHelper.js
│   ├── config/           # Konfigürasyon
│   ├── data/             # Mock data (frontend)
│   └── App.jsx           # Ana uygulama
├── database_optimizations.sql  # DB index'leri
├── mock_data_2months.sql      # 2 aylık test verisi
├── DATABASE_SETUP.md          # DB kurulum rehberi
└── IMPROVEMENTS_SUMMARY.md    # Özellik özeti
```

---

## 7️⃣ Günlük Bakım

### Materialized View Güncelle
```sql
-- Supabase SQL Editor'de (haftalık)
REFRESH MATERIALIZED VIEW employee_stats;
```

### NPM Audit
```bash
# Güvenlik açıklarını kontrol et
npm audit

# Otomatik düzelt
npm audit fix
```

---

## 8️⃣ Önemli Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview

# Paket güncelleme
npm update

# Cache temizleme
rm -rf node_modules
npm install
```

---

## 9️⃣ Faydalı Linkler

- **Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)
- **React Docs**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **Lucide Icons**: [lucide.dev](https://lucide.dev)
- **jsPDF Docs**: [github.com/parallax/jsPDF](https://github.com/parallax/jsPDF)
- **SheetJS Docs**: [docs.sheetjs.com](https://docs.sheetjs.com)

---

## 🆘 Yardım

### Hata Raporlama:
1. Tarayıcı konsolu hatalarını kopyala
2. Supabase logs kontrol et
3. Terminal çıktısını kontrol et

### Veritabanı Sorunu:
1. Supabase → Logs → Realtime/PostgREST
2. SQL Editor'de manuel sorgu test et
3. RLS politikalarını kontrol et

---

**Son Güncelleme**: Ocak 2025  
**Versiyon**: 2.0.0  
**Durum**: Production Ready ✅
