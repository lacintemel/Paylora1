# 💼 PayMaki - Modern İnsan Kaynakları Yönetim Sistemi

<div align="center">

![PayMaki Banner](https://img.shields.io/badge/-HR%20Management-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**Kurumsal İK süreçlerinizi dijitalleştirin**

[Hızlı Başlangıç](#-hızlı-başlangıç) • [Özellikler](#-özellikler) • [Kurulum](#-kurulum) • [Dokümantasyon](#-dokümantasyon)

</div>

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Dokümantasyon](#-dokümantasyon)
- [Katkıda Bulunma](#-katkıda-bulunma)

---

## 🎯 Genel Bakış

****, modern işletmelerin İnsan Kaynakları süreçlerini dijital ortamda yönetmesini sağlayan kapsamlı bir web uygulamasıdır.

### Temel Hedefler:
- ✅ Çalışan bordro süreçlerini otomatikleştirmek
- ✅ İzin yönetimini kolaylaştırmak
- ✅ Satış performansını takip etmek
- ✅ Zaman takibi ve devamsızlık kontrolü
- ✅ Rol tabanlı erişim kontrolü (RBAC)

---

## ✨ Özellikler

### 👥 Çalışan Yönetimi
- Detaylı çalışan profilleri
- Departman ve pozisyon takibi
- Avatar sistemi (baş harf otomasyonu)
- Silme onay süreci (HR → GM)
- Excel export

### 💰 Bordro Yönetimi
- Aylık bordro oluşturma
- Kazanç/kesinti detayları
- Otomatik hesaplamalar
- PDF export (detaylı raporlar)
- Ödeme durumu takibi

### 💼 Satış Modülü
- Satış kayıt ve takip
- Çalışan bazlı performans
- Aylık/yıllık karşılaştırma
- Excel export
- Dashboard grafikleri

### 🏖️ İzin Yönetimi
- İzin talep sistemi
- Onay/red süreçleri
- İzin türleri (yıllık, hastalık, mazeret)
- PDF export
- Takvim entegrasyonu

### ⏰ Zaman Takibi
- Giriş/çıkış kayıtları
- Mesai süresi hesaplama
- Geç kalma takibi
- Devamsızlık raporları

### 📊 Dashboard & Raporlama
- Genel Müdür Dashboard'u
- İK Dashboard'u
- Çalışan Dashboard'u
- Satış grafikleri (yüzdesel değişim)
- Yaklaşan etkinlikler

### 🔔 Bildirimler
- **✅ Toast Notifications** (yeni!)
- Modern popup mesajları
- Başarı/hata bildirimleri
- Auto-dismiss (3 saniye)

### 📥 Export Özellikleri
- **✅ Excel Export** (Satış, Çalışanlar)
- **✅ PDF Export** (Bordro, İzinler)
- Profesyonel formatlar
- Otomatik sütun genişliği
- Türkçe karakter desteği

### 🔐 Güvenlik
- Row Level Security (RLS)
- Rol bazlı erişim (GM, HR, Employee)
- Supabase Authentication
- Cascade delete (veri bütünlüğü)

---

## 🛠 Teknolojiler

### Frontend
- **React 18+** - Modern UI framework
- **Vite** - Lightning fast build tool
- **TailwindCSS** - Utility-first CSS
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Notifications
- **React Router** - Navigation

### Backend
- **Supabase** - PostgreSQL database
- **Row Level Security** - Data security
- **Real-time subscriptions** - Live updates

### Export & Reports
- **xlsx** - Excel file generation
- **jsPDF** - PDF generation
- **jsPDF-AutoTable** - PDF tables

### Development
- **ESLint** - Code quality
- **PostCSS** - CSS processing
- **Node.js 18+** - Runtime

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı

### 1. Klonlama
```bash
git clone https://github.com/your-username/.git
cd 
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. Environment Değişkenleri
`.env` dosyası oluştur:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Veritabanı Kurulumu
1. Supabase Dashboard → SQL Editor
2. `database_optimizations.sql` çalıştır
3. `mock_data_2months.sql` çalıştır (test verisi)

### 5. Uygulamayı Başlat
```bash
npm run dev
```

Tarayıcıda: `http://localhost:5173`

---

## 📦 Kurulum

Detaylı kurulum için: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### Veritabanı Tabloları
```sql
-- Temel tablolar
employees
payrolls
sales
time_logs
leave_requests
calendar_events
deletion_requests
company_settings
```

### Index'ler & Optimizasyon
- 15+ performans index'i
- Foreign key cascade delete
- Materialized view (employee_stats)
- Automatic VACUUM & ANALYZE

### Mock Data (2 Ay)
- 10 çalışan
- 20 bordro kaydı
- ~95 satış
- ~400 zaman kaydı
- ~20 izin talebi
- 12 takvim etkinliği

---

## 💡 Kullanım

### Giriş Yapma
```
Genel Müdür: ahmet.yilmaz@.com
İK Müdürü:   ayse.demir@.com
Çalışan:     mehmet.kaya@.com
```
> ⚠️ Şifreler Supabase Auth'da manuel oluşturulmalı

### Temel İşlemler

#### Bordro Oluşturma
1. Payroll → **Oluştur** butonu
2. Ay seçimi → Otomatik tüm çalışanlar için bordro
3. Düzenle → Kazanç/kesinti ekle
4. PDF İndir

#### Satış Ekleme
1. Sales → **Yeni Satış** butonu
2. Form doldur
3. Çalışan seçimi
4. Kaydet → Toast bildirimi

#### İzin Talep Etme
1. Leave Management → **İzin Talep Et**
2. Tarih ve tür seç
3. Neden yaz
4. Gönder → HR'a bildirim

---

## 📚 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [QUICK_START.md](./QUICK_START.md) | Hızlı başlangıç rehberi |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Veritabanı kurulum detayları |
| [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) | Son güncelleme özeti |

### API Endpoints (Supabase)
```javascript
// Örnek kullanım
import { supabase } from './supabase';

// Çalışan listesi
const { data } = await supabase
  .from('employees')
  .select('*')
  .eq('status', 'Active');

// Bordro oluştur
await supabase
  .from('payrolls')
  .insert({
    employee_id: id,
    period: '2025-01',
    base_salary: 10000
  });
```

---

## 🎨 UI/UX Özellikleri

- **Responsive Design** - Mobil uyumlu
- **Dark Mode Ready** - Koyu tema hazır (aktif değil)
- **Toast Notifications** - Modern bildirimler
- **Loading States** - Yükleme göstergeleri
- **Empty States** - Boş durum mesajları
- **Error Handling** - Kullanıcı dostu hatalar

---

## 🔄 Güncellemeler

### v2.0.0 (Ocak 2025)
- ✅ Toast notification sistemi
- ✅ Excel/PDF export özellikleri
- ✅ Database optimizasyonları (15+ index)
- ✅ Mock data (2 ay)
- ✅ Cascade delete

### v1.5.0 (Aralık 2024)
- Satış modülü
- Performance page enhancements
- GM Dashboard grafikleri
- Avatar helper sistemi

### v1.0.0 (Kasım 2024)
- İlk stabil sürüm
- Temel CRUD işlemleri
- RLS politikaları
- Rol tabanlı erişim

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 

### Nasıl Katkıda Bulunulur?
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Kod Standartları
- ESLint kurallarına uyun
- Türkçe UI metinleri
- Responsive design
- Toast notifications kullanın (alert() değil!)

---

## 📝 Lisans

Bu proje özel kullanım içindir. Ticari kullanım için izin gereklidir.

---

## 👨‍💻 Geliştirici

** Development Team**

- 📧 Email: info@.com
- 🌐 Website: [.com](https://.com)
- 💼 LinkedIn: [](https://linkedin.com/company/)

---

## 🙏 Teşekkürler

- [Supabase](https://supabase.com) - Amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) - Beautiful styling
- [Lucide](https://lucide.dev) - Icon library
- [React](https://react.dev) - UI framework

---

## 📊 İstatistikler

![GitHub repo size](https://img.shields.io/github/repo-size/your-username/)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/)
![GitHub issues](https://img.shields.io/github/issues/your-username/)

---

<div align="center">

** ile İK süreçlerinizi dijitalleştirin! 🚀**

Made with ❤️ by  Team

[⬆ Başa Dön](#----modern-insan-kaynakları-yönetim-sistemi)

</div>
