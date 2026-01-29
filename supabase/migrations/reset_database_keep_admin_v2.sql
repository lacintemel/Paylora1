-- ==========================================
-- DATABASE RESET - Admin, Maida, Elnara Korunacak
-- ==========================================
-- Diğer tüm verileri siler, sadece 3 hesabı korur

-- 1. İlişkili tabloları temizle (admin, maida, elnara HARİÇ)
DELETE FROM attendance 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

DELETE FROM leave_records 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

DELETE FROM payrolls 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

DELETE FROM sales 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

DELETE FROM time_logs 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

DELETE FROM leave_requests 
WHERE employee_id NOT IN (
  SELECT id FROM employees 
  WHERE LOWER(name) IN ('admin', 'maida', 'elnara')
  OR email IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
);

-- 2. Employees tablosunu temizle (admin, maida, elnara HARİÇ)
DELETE FROM employees 
WHERE LOWER(name) NOT IN ('admin', 'maida', 'elnara')
  AND email NOT IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com');

-- 3. Diğer global tabloları tamamen temizle
DELETE FROM calendar_events;
DELETE FROM deletion_requests;

-- Tüm izin/mesai/bordro kayıtlarını sıfırla
DELETE FROM attendance;
DELETE FROM leave_records;
DELETE FROM payrolls;

-- ==========================================
-- YENİ MOCK ÇALIŞANLAR EKLE
-- ==========================================

INSERT INTO employees (id, name, email, position, department, start_date, salary, status, phone, avatar)
VALUES
  (gen_random_uuid(), 'Ahmet Yılmaz', 'ahmet.yilmaz@paymaki.com', 'Software Engineer', 'IT', '2024-01-15', 72000, 'Active', '+90 532 111 2233', 'AY'),
  (gen_random_uuid(), 'Zeynep Kaya', 'zeynep.kaya@paymaki.com', 'Product Manager', 'Product', '2023-06-01', 90000, 'Active', '+90 533 222 3344', 'ZK'),
  (gen_random_uuid(), 'Mehmet Demir', 'mehmet.demir@paymaki.com', 'Sales Representative', 'Sales', '2024-03-10', 60000, 'Active', '+90 534 333 4455', 'MD'),
  (gen_random_uuid(), 'Ayşe Şahin', 'ayse.sahin@paymaki.com', 'Marketing Specialist', 'Marketing', '2023-09-20', 66000, 'Active', '+90 535 444 5566', 'AŞ'),
  (gen_random_uuid(), 'Can Özkan', 'can.ozkan@paymaki.com', 'Backend Developer', 'IT', '2024-02-01', 84000, 'Active', '+90 536 555 6677', 'CÖ'),
  (gen_random_uuid(), 'Elif Arslan', 'elif.arslan@paymaki.com', 'UX Designer', 'Design', '2023-11-15', 78000, 'Active', '+90 537 666 7788', 'EA'),
  (gen_random_uuid(), 'Burak Çelik', 'burak.celik@paymaki.com', 'DevOps Engineer', 'IT', '2024-04-01', 96000, 'Active', '+90 538 777 8899', 'BÇ'),
  (gen_random_uuid(), 'Selin Yıldız', 'selin.yildiz@paymaki.com', 'HR Specialist', 'HR', '2023-07-10', 54000, 'Active', '+90 539 888 9900', 'SY'),
  (gen_random_uuid(), 'Emre Korkmaz', 'emre.korkmaz@paymaki.com', 'Data Analyst', 'Analytics', '2024-05-15', 70000, 'Active', '+90 530 999 0011', 'EK'),
  (gen_random_uuid(), 'Gizem Aydın', 'gizem.aydin@paymaki.com', 'Content Writer', 'Marketing', '2023-12-01', 48000, 'Active', '+90 531 100 1122', 'GA')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- YENİ ATTENDANCE & LEAVE DATA (Ocak 2026)
-- ==========================================

-- Ocak 2026 için izin kayıtları ekle
WITH new_employee_leaves AS (
  SELECT e.id as employee_id, 'unpaid' as leave_type, DATE '2026-01-20' as start_date, DATE '2026-01-21' as end_date, 2.0 as days, 'Approved' as status, 'Ücretsiz izin (Ahmet)' as reason FROM employees e WHERE e.email = 'ahmet.yilmaz@paymaki.com'
  UNION ALL SELECT e.id, 'annual', DATE '2026-01-08', DATE '2026-01-09', 2.0, 'Approved', 'Yıllık izin' FROM employees e WHERE e.email = 'zeynep.kaya@paymaki.com'
  UNION ALL SELECT e.id, 'sick', DATE '2026-01-13', DATE '2026-01-14', 2.0, 'Approved', 'Hastalık izni' FROM employees e WHERE e.email = 'mehmet.demir@paymaki.com'
  UNION ALL SELECT e.id, 'unpaid', DATE '2026-01-25', DATE '2026-01-25', 1.0, 'Approved', 'Ücretsiz izin' FROM employees e WHERE e.email = 'selin.yildiz@paymaki.com'
  UNION ALL SELECT e.id, 'annual', DATE '2026-01-12', DATE '2026-01-12', 1.0, 'Approved', 'Yıllık izin' FROM employees e WHERE e.email = 'ayse.sahin@paymaki.com'
  UNION ALL SELECT e.id, 'sick', DATE '2026-01-22', DATE '2026-01-23', 2.0, 'Approved', 'Sağlık raporu ile hastalık izni' FROM employees e WHERE e.email = 'elif.arslan@paymaki.com'
  UNION ALL SELECT e.id, 'unpaid', DATE '2026-01-27', DATE '2026-01-28', 2.0, 'Approved', 'Ücretsiz izin' FROM employees e WHERE e.email = 'ahmet.yilmaz@paymaki.com'
)
INSERT INTO leave_records (employee_id, leave_type, start_date, end_date, days, status, reason)
SELECT employee_id, leave_type, start_date, end_date, days, status, reason FROM new_employee_leaves
ON CONFLICT DO NOTHING;

-- Leave requests tablosuna da ekle
WITH leave_for_requests AS (
  SELECT e.id as employee_id, 'unpaid' as leave_type, DATE '2026-01-20' as start_date, DATE '2026-01-21' as end_date, 2.0 as days, 'Approved' as status, 'Ücretsiz izin (Ahmet)' as reason FROM employees e WHERE e.email = 'ahmet.yilmaz@paymaki.com'
  UNION ALL SELECT e.id, 'annual', DATE '2026-01-08', DATE '2026-01-09', 2.0, 'Approved', 'Yıllık izin' FROM employees e WHERE e.email = 'zeynep.kaya@paymaki.com'
  UNION ALL SELECT e.id, 'sick', DATE '2026-01-13', DATE '2026-01-14', 2.0, 'Approved', 'Hastalık izni' FROM employees e WHERE e.email = 'mehmet.demir@paymaki.com'
  UNION ALL SELECT e.id, 'unpaid', DATE '2026-01-25', DATE '2026-01-25', 1.0, 'Approved', 'Ücretsiz izin' FROM employees e WHERE e.email = 'selin.yildiz@paymaki.com'
  UNION ALL SELECT e.id, 'annual', DATE '2026-01-12', DATE '2026-01-12', 1.0, 'Approved', 'Yıllık izin' FROM employees e WHERE e.email = 'ayse.sahin@paymaki.com'
  UNION ALL SELECT e.id, 'sick', DATE '2026-01-22', DATE '2026-01-23', 2.0, 'Approved', 'Sağlık raporu ile hastalık izni' FROM employees e WHERE e.email = 'elif.arslan@paymaki.com'
  UNION ALL SELECT e.id, 'unpaid', DATE '2026-01-27', DATE '2026-01-28', 2.0, 'Approved', 'Ücretsiz izin' FROM employees e WHERE e.email = 'ahmet.yilmaz@paymaki.com'
)
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, reason)
SELECT employee_id, leave_type, start_date, end_date, days, status, reason FROM leave_for_requests
ON CONFLICT DO NOTHING;

-- Ocak 2026 attendance (mesai kayıtları) - Hafta içi günler
WITH employee_hours AS (
  SELECT e.id, e.email, CASE WHEN e.email IN ('mehmet.demir@paymaki.com', 'selin.yildiz@paymaki.com', 'gizem.aydin@paymaki.com') THEN 7 WHEN e.email IN ('can.ozkan@paymaki.com', 'burak.celik@paymaki.com', 'emre.korkmaz@paymaki.com') THEN 9 ELSE 8 END AS daily_hours FROM employees e WHERE e.email NOT IN ('admin@paymaki.com', 'maida@paymaki.com', 'elnara@paymaki.com')
)
INSERT INTO attendance (employee_id, clock_in, clock_out, worked_hours, date, notes)
SELECT eh.id, (DATE '2026-01-01' + (i || ' days')::INTERVAL)::timestamp + INTERVAL '9 hours', (DATE '2026-01-01' + (i || ' days')::INTERVAL)::timestamp + INTERVAL '9 hours' + (eh.daily_hours || ' hours')::INTERVAL, eh.daily_hours, DATE '2026-01-01' + (i || ' days')::INTERVAL, CASE WHEN eh.daily_hours = 7 THEN 'Kısa mesai' WHEN eh.daily_hours = 9 THEN 'Uzun mesai' ELSE 'Normal mesai' END
FROM employee_hours eh
CROSS JOIN GENERATE_SERIES(0, 28) AS i
WHERE EXTRACT(DOW FROM DATE '2026-01-01' + (i || ' days')::INTERVAL) NOT IN (0, 6)
  AND NOT EXISTS (SELECT 1 FROM leave_records lr WHERE lr.employee_id = eh.id AND lr.status = 'Approved' AND (DATE '2026-01-01' + (i || ' days')::INTERVAL) BETWEEN lr.start_date AND lr.end_date)
ON CONFLICT DO NOTHING;

-- Fazla mesai ekle
INSERT INTO attendance (employee_id, clock_in, clock_out, worked_hours, date, notes)
SELECT e.id, DATE '2026-01-15' + INTERVAL '18 hours', DATE '2026-01-15' + INTERVAL '22 hours', 4.0, DATE '2026-01-15', 'Fazla mesai - Proje deadline'
FROM employees e WHERE e.email IN ('can.ozkan@paymaki.com', 'burak.celik@paymaki.com', 'emre.korkmaz@paymaki.com')
ON CONFLICT DO NOTHING;

-- ==========================================
-- YENİ PAYROLL DATA (Ocak 2026)
-- ==========================================

INSERT INTO payrolls (employee_id, period, base_salary, worked_days, worked_hours, hourly_rate, earnings_details, deductions_details, leave_details, status, notes, net_pay)
SELECT 
  e.id, '2026-01', e.salary,
  (SELECT COUNT(DISTINCT date) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31'),
  (SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31'),
  ROUND((e.salary / 12 / 160)::numeric, 2),
  jsonb_build_array(
    jsonb_build_object('id', 'bonus', 'name', 'İkramiye / Bonus', 'type', 'fixed', 'value', 0),
    jsonb_build_object('id', 'overtime', 'name', 'Fazla Mesai', 'type', 'fixed', 'value', 
      CASE WHEN (SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') > 160 
      THEN ROUND(((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') - 160) * (e.salary / 12 / 160) * 1.5, 2)
      ELSE 0 END),
    jsonb_build_object('id', 'commission', 'name', 'Komisyon', 'type', 'fixed', 'value', 0),
    jsonb_build_object('id', 'premium', 'name', 'Prim', 'type', 'fixed', 'value', 0),
    jsonb_build_object('id', 'tip', 'name', 'Bahşiş (Tip)', 'type', 'fixed', 'value', 0)
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'sgk', 'name', 'SGK İşçi Payı', 'type', 'percent', 'value', 14),
    jsonb_build_object('id', 'unemployment', 'name', 'İşsizlik Sigortası', 'type', 'percent', 'value', 1),
    jsonb_build_object('id', 'income_tax', 'name', 'Gelir Vergisi', 'type', 'percent', 'value', 15),
    jsonb_build_object('id', 'stamp_tax', 'name', 'Damga Vergisi', 'type', 'percent', 'value', 0.759),
    jsonb_build_object('id', 'unpaid_leave', 'name', 'Ücretsiz İzin Kesintisi', 'type', 'fixed', 'value',
      COALESCE((SELECT SUM(lr.days::numeric * (e.salary::numeric / 12::numeric / 160::numeric) * 8::numeric) FROM leave_records lr WHERE lr.employee_id = e.id AND lr.leave_type = 'unpaid' AND lr.status = 'Approved' AND lr.start_date <= '2026-01-31' AND lr.end_date >= '2026-01-01'), 0::numeric)),
    jsonb_build_object('id', 'advance', 'name', 'Avans Kesintisi', 'type', 'fixed', 'value', 0)
  ),
  COALESCE((SELECT jsonb_agg(jsonb_build_object('leave_type', CONCAT(CASE leave_type WHEN 'unpaid' THEN 'Ücretsiz İzin' WHEN 'annual' THEN 'Yıllık İzin' WHEN 'sick' THEN 'Hastalık İzni' ELSE leave_type END, ' (Toplam: ', (SELECT SUM(days)::int FROM leave_records WHERE employee_id = e.id AND leave_type = lr.leave_type AND status = 'Approved' AND start_date <= '2026-01-31' AND end_date >= '2026-01-01'), ' Gün)'), 'days', days, 'start_date', to_char(start_date, 'YYYY-MM-DD'), 'end_date', to_char(end_date, 'YYYY-MM-DD'), 'reason', reason) ORDER BY start_date) FROM leave_records lr WHERE lr.employee_id = e.id AND lr.status = 'Approved' AND lr.start_date <= '2026-01-31' AND lr.end_date >= '2026-01-01'), '[]'::jsonb),
  'Pending', 'Ocak 2026 - Yeni dönem',
  ROUND((
    (SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') * (e.salary / 12 / 160)
    + CASE WHEN (SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') > 160 THEN ((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') - 160) * (e.salary / 12 / 160) * 1.5 ELSE 0 END
    - ((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') * (e.salary / 12 / 160) * 0.14)
    - ((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') * (e.salary / 12 / 160) * 0.01)
    - ((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') * (e.salary / 12 / 160) * 0.15)
    - ((SELECT COALESCE(SUM(worked_hours), 0) FROM attendance a WHERE a.employee_id = e.id AND a.date BETWEEN '2026-01-01' AND '2026-01-31') * (e.salary / 12 / 160) * 0.00759)
    - COALESCE((SELECT SUM(lr.days::numeric * (e.salary::numeric / 12::numeric / 160::numeric) * 8::numeric) FROM leave_records lr WHERE lr.employee_id = e.id AND lr.leave_type = 'unpaid' AND lr.status = 'Approved' AND lr.start_date <= '2026-01-31' AND lr.end_date >= '2026-01-01'), 0::numeric)
  )::numeric, 2)
FROM employees e
WHERE e.email NOT IN ('admin@paymaki.com')
ON CONFLICT DO NOTHING;

-- ==========================================
-- SATIŞ VERİLERİ (Ocak 2026)
-- ==========================================

INSERT INTO sales (product_name, amount, sale_date, employee_id, created_by, notes)
SELECT 
  product, amount, date, 
  CASE 
    WHEN product LIKE '%Yazılım%' THEN (SELECT id FROM employees WHERE email = 'ahmet.yilmaz@paymaki.com')
    WHEN product LIKE '%Tasarım%' THEN (SELECT id FROM employees WHERE email = 'elif.arslan@paymaki.com')
    WHEN product LIKE '%Satış%' THEN (SELECT id FROM employees WHERE email = 'mehmet.demir@paymaki.com')
    WHEN product LIKE '%Veri%' THEN (SELECT id FROM employees WHERE email = 'emre.korkmaz@paymaki.com')
    WHEN product LIKE '%Ürün%' THEN (SELECT id FROM employees WHERE email = 'zeynep.kaya@paymaki.com')
    ELSE NULL 
  END,
  (SELECT id FROM employees WHERE email = 'admin@paymaki.com'),
  note
FROM (
  SELECT 'Yazılım Geliştirme Hizmetleri' as product, 5500.00 as amount, DATE '2025-12-03' as date, 'Kurumsal sistem projesi' as note
  UNION ALL SELECT 'Danışmanlık Hizmeti', 3200.00, DATE '2025-12-05', 'Teknoloji danışmanlığı'
  UNION ALL SELECT 'Tasarım ve UX/UI', 2800.00, DATE '2025-12-07', 'Web arayüz tasarımı'
  UNION ALL SELECT 'Veri Analiz Raporu', 4100.00, DATE '2025-12-08', 'Aylık performans analizi'
  UNION ALL SELECT 'Yazılım Geliştirme Hizmetleri', 6200.00, DATE '2025-12-10', 'Mobil uygulama'
  UNION ALL SELECT 'Ürün Satışı - Premium Paket', 7500.00, DATE '2025-12-12', 'Enterprise lisans'
  UNION ALL SELECT 'Satış Danışmanlığı', 2900.00, DATE '2025-12-13', 'B2B stratejisi'
  UNION ALL SELECT 'Tasarım ve UX/UI', 3400.00, DATE '2025-12-14', 'Logo ve kimlik tasarımı'
  UNION ALL SELECT 'Yazılım Geliştirme Hizmetleri', 5800.00, DATE '2025-12-15', 'API geliştirmesi'
  UNION ALL SELECT 'Veri Analiz Raporu', 3500.00, DATE '2025-12-17', 'Satış analizi'
  UNION ALL SELECT 'Danışmanlık Hizmeti', 4200.00, DATE '2025-12-18', 'Dijital dönüşüm'
  UNION ALL SELECT 'Ürün Satışı - Standard Paket', 4800.00, DATE '2025-12-20', 'Yıllık lisans'
  UNION ALL SELECT 'Yazılım Geliştirme Hizmetleri', 6100.00, DATE '2025-12-22', 'Entegrasyon çalışması'
  UNION ALL SELECT 'Tasarım ve UX/UI', 2600.00, DATE '2025-12-23', 'Sunum materyalleri'
  UNION ALL SELECT 'Satış Danışmanlığı', 3300.00, DATE '2025-12-24', 'Pazarlama stratejisi'
  UNION ALL SELECT 'Veri Analiz Raporu', 3800.00, DATE '2025-12-25', 'İş zekası raporu'
  UNION ALL SELECT 'Yazılım Geliştirme Hizmetleri', 5400.00, DATE '2025-12-27', 'Sistem optimizasyonu'
  UNION ALL SELECT 'Danışmanlık Hizmeti', 2700.00, DATE '2025-12-28', 'İnsan kaynakları danışmanlığı'
  UNION ALL SELECT 'Ürün Satışı - Premium Paket', 8200.00, DATE '2025-12-29', 'Enterprise+ lisans'
  UNION ALL SELECT 'Tasarım ve UX/UI', 4100.00, DATE '2025-12-30', 'Tüm tasarım elemanları'
) AS sales_data
ON CONFLICT DO NOTHING;
