# Paylora Veritabanı Kurulum Rehberi

## 📋 İçindekiler
1. [Veritabanı Optimizasyonları](#veritabanı-optimizasyonları)
2. [Mock Data Yükleme](#mock-data-yükleme)
3. [Kurulum Sırası](#kurulum-sırası)

---

## 🚀 Veritabanı Optimizasyonları

### Dosya: `database_optimizations.sql`

Bu SQL script'i şunları içerir:

#### ✅ Index'ler
- **Employees**: email, status, department, role
- **Payrolls**: period, employee_id, status, (employee_id + period)
- **Sales**: sale_date, employee_id, (employee_id + sale_date)
- **Time Logs**: date, employee_id, status, (employee_id + date)
- **Leave Requests**: employee_id, status, start_date, end_date
- **Calendar Events**: event_date, event_type
- **Deletion Requests**: target_employee_id, status

#### ✅ Foreign Key Cascade Delete
Tüm ilişkili tablolarda `ON DELETE CASCADE` ve `ON DELETE SET NULL` kuralları eklendi:
- Payrolls → Employees
- Sales → Employees
- Time Logs → Employees
- Leave Requests → Employees
- Deletion Requests → Employees

#### ✅ Performance Enhancements
- Materialized View: `employee_stats` (istatistik rapor performansı için)
- ANALYZE komutları
- VACUUM ANALYZE (bakım)

### Çalıştırma
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `database_optimizations.sql` dosyasını açın
4. Tüm script'i seçip çalıştırın (Run)

**⚠️ Not:** Foreign key değişiklikleri mevcut veriler üzerinde çalışabilir, ancak yetim kayıtlar (orphaned records) varsa hata verebilir.

---

## 📊 Mock Data Yükleme

### Dosya: `mock_data_2months.sql`

Bu script 2 aylık test verisi oluşturur:
- **Aralık 2024**
- **Ocak 2025**

### İçerik:

#### 👥 Employees (10 kişi)
- 1 Genel Müdür
- 1 İK Müdürü
- 8 Çalışan (Satış, Pazarlama, Finans, IT, Müşteri Hizmetleri)

#### 💰 Payrolls
- **Aralık 2024**: 10 bordro kaydı
- **Ocak 2025**: 10 bordro kaydı
- Otomatik hesaplanan kesintiler ve primler

#### 💼 Sales
- **Aralık 2024**: ~50 satış
- **Ocak 2025**: ~45 satış
- Satış ve Pazarlama departmanlarına dağıtılmış

#### ⏰ Time Logs
- **Aralık 2024**: ~200 giriş-çıkış kaydı (hafta içi)
- **Ocak 2025**: ~200 giriş-çıkış kaydı (hafta içi)
- %90 devam oranı
- Rastgele geç kalma kayıtları

#### 🏖️ Leave Requests
- ~15-20 izin talebi
- Approved, Pending, Rejected durumları
- Yıllık, hastalık, mazeret izinleri

#### 📅 Calendar Events
- 12 event (toplantı, eğitim, tatil, etkinlik)
- Aralık ve Ocak ayları için

### Çalıştırma
1. Supabase Dashboard → SQL Editor
2. `mock_data_2months.sql` dosyasını açın
3. Tüm script'i çalıştırın

**✅ Script sonunda özet rapor görüntülenir:**
```
=================================
MOCK DATA LOADING COMPLETED
=================================
Employees: 10
Payrolls (Dec 2024): 10
Payrolls (Jan 2025): 10
Sales (Dec 2024): 50
Sales (Jan 2025): 45
...
```

---

## 📝 Kurulum Sırası

### Tavsiye Edilen Sıra:

```bash
1️⃣ Database Optimizations
   └─ database_optimizations.sql

2️⃣ Mock Data
   └─ mock_data_2months.sql
```

### Tam Kurulum Adımları:

1. **Veritabanı Optimizasyonlarını Çalıştır**
   ```sql
   -- Supabase SQL Editor'de
   -- database_optimizations.sql içeriğini yapıştır ve çalıştır
   ```

2. **Mock Data Yükle**
   ```sql
   -- Supabase SQL Editor'de
   -- mock_data_2months.sql içeriğini yapıştır ve çalıştır
   ```

3. **Materialized View'ı Güncelle** (İsteğe bağlı)
   ```sql
   REFRESH MATERIALIZED VIEW employee_stats;
   ```

4. **Supabase RLS Politikalarını Kontrol Et**
   - Tüm tablolar için RLS aktif mi?
   - Politikalar doğru çalışıyor mu?

---

## 🔧 Bakım ve Güncelleme

### Materialized View Güncellemesi
Performans raporları için `employee_stats` view'ını düzenli olarak güncelleyin:

```sql
-- Günlük (Supabase Cron Job veya Edge Function ile)
REFRESH MATERIALIZED VIEW employee_stats;
```

### Periyodik Bakım
```sql
-- Haftalık
ANALYZE employees, payrolls, sales, time_logs, leave_requests;

-- Aylık
VACUUM ANALYZE employees;
VACUUM ANALYZE payrolls;
VACUUM ANALYZE sales;
VACUUM ANALYZE time_logs;
```

---

## ⚠️ Önemli Notlar

1. **Veri Çakışması**: Mock data script `ON CONFLICT DO NOTHING` kullanır, mevcut veriler korunur.
2. **Foreign Keys**: Cascade delete aktif, bir employee silindiğinde ilişkili tüm kayıtlar da silinir.
3. **Performance**: Index'ler büyük veri setlerinde sorgu hızını 10-100x artırabilir.
4. **Materialized Views**: Karmaşık join'ler için hız kazanır ama manuel güncelleme gerektirir.

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Supabase Logs'u kontrol edin
2. SQL hata mesajlarını inceleyin
3. RLS politikalarını doğrulayın
4. Transaction log'larına bakın

---

**Son Güncelleme**: Ocak 2025
**Versiyon**: 1.0.0
