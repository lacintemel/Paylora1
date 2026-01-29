# Clock In/Out ve Maaş Hesaplama Sistemi - Kurulum Rehberi

## 🎯 Sistem Özellikleri

Bu sistemin 5 temel bileşeni vardır:

### 1. **Zaman Takibi (TimeTracking)**
- Çalışanlar günde bir kez giriş yapabilir (Check-In)
- Günün sonunda çıkış yapabilir (Check-Out)
- Otomatik olarak çalışılan saatler hesaplanır

### 2. **Bordro Hesaplama**
- Çalışılan saat ve gün sayısından bordro hesaplanır
- Yasal kesintiler otomatik uygulanır (SGK, Vergi, vb.)
- Fazla mesai ve bonuslar eklenebilir

### 3. **İzin Yönetimi**
- İzin türleri (Yıllık, Hastalık, İzinsiz, vb.)
- Her izin türü Bordro'da görülür
- PDF raporlarda izin detayları yer alır

### 4. **PDF Raporları**
- **Özet Format**: Yatay (landscape) tablo - tüm çalışanlar bir sayfada
- **Detaylı Format**: Dikey (portrait) - her çalışanın ayrı sayfa
- Tüm Türkçe karakterler İngilizceye dönüştürülür

### 5. **Veritabanı**
- `attendance`: Clock in/out kayıtları
- `leave_records`: İzin kayıtları
- `payrolls`: Bordro ve hesaplamalar

---

## 📋 Database Kurulumu

### Supabase'de SQL Migration Çalıştırma

`supabase/migrations/add_attendance_system.sql` dosyasındaki SQL'i çalıştırın:

```bash
supabase db push
```

Veya Supabase Dashboard > SQL Editor'de dosyayı kopyalayıp yapıştırın.

### Oluşturulan Tablolar

#### 1. `attendance` (Giriş/Çıkış Kayıtları)
```sql
- id (UUID, Primary Key)
- employee_id (UUID, Foreign Key → employees)
- clock_in (TIMESTAMP) - Giriş saati
- clock_out (TIMESTAMP) - Çıkış saati (nullable)
- worked_hours (DECIMAL) - Hesaplanan çalışılan saat
- date (DATE) - Tarih
- notes (TEXT) - Notlar
- created_at, updated_at
```

#### 2. `leave_records` (İzin Kayıtları)
```sql
- id (UUID, Primary Key)
- employee_id (UUID, Foreign Key → employees)
- leave_type (VARCHAR) - 'annual', 'sick', 'unpaid', 'maternity'
- start_date (DATE)
- end_date (DATE)
- days (DECIMAL) - Kaç gün izin
- status (VARCHAR) - 'Pending', 'Approved', 'Rejected'
- reason (TEXT)
- created_at, updated_at
```

#### 3. `payrolls` (Bordro - Güncellemeler)
Mevcut tabloya yeni alanlar eklenir:
```sql
- worked_days DECIMAL DEFAULT 20
- worked_hours DECIMAL DEFAULT 160
- hourly_rate DECIMAL
- attendance_notes TEXT
```

---

## 🔧 Fonksiyonlar

### attendanceUtils.js

#### `recordAttendance(employeeId, action)`
Clock in/out işlemi yapar.
```javascript
import { recordAttendance } from '../utils/attendanceUtils';

// Giriş yap
const result = await recordAttendance(userId, 'in');

// Çıkış yap
const result = await recordAttendance(userId, 'out');
```

#### `calculateWorkedHoursForPeriod(employeeId, period)`
Bir ay için çalışılan saatleri hesaplar.
```javascript
const result = await calculateWorkedHoursForPeriod(userId, '2026-01');
// Döner: { success: true, worked_hours: 160, worked_days: 20 }
```

#### `getApprovedLeavesForPeriod(employeeId, period)`
Onaylı izinleri dönem için getir.
```javascript
const leaves = await getApprovedLeavesForPeriod(userId, '2026-01');
// Döner: [{ leave_type: 'annual', days: 5 }, ...]
```

#### `calculateCompletePayroll(payroll, attendanceData)`
Tam bordro hesaplaması (attendance verisiyle beraber).
```javascript
const completePayroll = calculateCompletePayroll(
  payrollObject,
  { 
    worked_hours: 160, 
    worked_days: 20,
    leave_records: []
  }
);
```

#### `updatePayrollWithAttendance(payrollId, employeeId, period)`
Bordroyu attendance verisiyle otomatik günceller.
```javascript
const result = await updatePayrollWithAttendance(payrollId, userId, '2026-01');
```

---

## 🎨 UI Bileşenleri

### TimeTracking.jsx
- Çalışanların giriş/çıkış yapmalarını sağlar
- Geçmiş kayıtları gösterir
- Canlı saat gösterir

### Payroll.jsx - Detail Modal
- Çalışılan gün/saat/izin detaylarını gösterir (4 kolon)
- İzin türlerini listeler
- Bordro hesaplamasını canlı günceller

### PDF Export
- **Özet**: Landscape - 9 kolon (Çalışan, Çalış.Gün, İzin, Maaş, Kazançlar, Yasal Kesinti, Özel Kesinti, Net, Durum)
- **Detaylı**: Portrait - Her çalışan için sayfada:
  - Çalışma Günü/Saati/İzin bilgileri
  - Temel Maaş ve Kazançlar
  - Yasal ve Özel Kesintiler
  - Net Ödenen Ücret

---

## 📊 Maaş Hesaplama Formülü

```
Brüt Maaş = Temel Maaş × (Çalışılan Saat / 160 saat)

Yasal Kesintiler = Brüt × Kuralar
  - SGK: %14
  - İşsizlik: %1
  - Gelir Vergisi: %15
  - Damga: %0.759

Özel Kesintiler = Avans + Diğer

Net Maaş = Brüt + Kazançlar - Yasal Kesintiler - Özel Kesintiler
```

### Örnek Hesaplama:
```
Temel Maaş: 5000 TL/ay (160 saat)
Saatlik Ücret: 31.25 TL/saat

Eğer 120 saat çalışmışsa:
Brüt = 5000 × (120/160) = 3750 TL

SGK Kesintisi = 3750 × 0.14 = 525 TL
İşsizlik = 3750 × 0.01 = 37.5 TL
Vergi = 3750 × 0.15 = 562.5 TL

Toplam Kesinti = 1125 TL
Net Maaş = 3750 - 1125 = 2625 TL
```

---

## 🚀 Kullanım Adımları

### 1. Çalışan Giriş/Çıkış
1. TimeTracking sayfasına git
2. "Giriş Yap" butonuna tıkla → `attendance` tablosuna kayıt eklenir
3. Gün sonunda "Çıkış Yap" butonuna tıkla → Saat hesaplanır

### 2. İzin Tanımlama
1. İzin yönetim sayfasında (varsa) izin oluştur
2. HR tarafından onayla → `leave_records` tablosuna kaydedilir
3. Status = 'Approved' olunca bordro hesaplamasında görülür

### 3. Bordro Oluşturma
1. Payroll sayfasında ay seç
2. "Bordro Oluştur" butonuna tıkla
3. Her çalışan için otomatik bordro oluşturulur
4. `calculateWorkedHoursForPeriod` çağrılarak saat verisi çekilir
5. `getApprovedLeavesForPeriod` çağrılarak izin verisi çekilir

### 4. Bordro Detayı Görüntüle
1. Bordro tablosundan bir satıra tıkla
2. Modal açılır → Attendance bilgileri yüklenir
3. Çalışılan Günü, Saati, İzin detaylarını görebilirsin
4. Kesintileri ve kazançları düzenle (Manager ise)

### 5. PDF İndir
1. "Toplu İndir" → Format seç (Özet/Detaylı)
2. "Personel PDF İndir" → Sadece bu çalışanın PDF'i
3. PDF otomatik indirilir

---

## 🔐 Güvenlik Notları

- **Çalışan (Employee)**: Sadece kendi giriş/çıkışını görebilir
- **Manager (HR/General Manager)**: Tüm çalışanları görebilir
- **İzin Onayı**: Sadece HR tarafından yapılabilir
- **Bordro Değişikliği**: Sadece Manager tarafından

---

## ⚠️ Hata Giderme

### Hata: "clock_in is not a function"
✅ Çözüm: TimeTracking.jsx'de `recordAttendance` import edilip çağrılıyor mu kontrol et

### Hata: "attendance table not found"
✅ Çözüm: `supabase db push` komutuyla migration çalıştır

### Hata: "worked_hours undefined in PDF"
✅ Çözüm: Bordro detayını açarken `attendanceStats` yüklenene kadar bekle

### Hata: "Turkish characters showing wrong in PDF"
✅ Çözüm: `cleanTurkish()` fonksiyonu tüm text'e uygulanıyor. Export etmek istediğin veriyi kontrol et.

---

## 📝 Test Senaryosu

1. Bir test çalışanı oluştur
2. TimeTracking'de giriş yap (09:00)
3. Bir süre bekle, sonra çıkış yap (17:00)
4. Bordro oluştur (ayı seç)
5. Bordro detayını aç → 8 saat görmeli
6. "Toplu İndir" → Özet PDF indir
7. PDF'de tabloda `Calisma Gun: 1` ve `Izin: -` görmeli

---

## 📞 İletişim

Soruların var mı? GitHub issue açabilir veya dokümentasyonu güncellemeyi tavsiye et.

