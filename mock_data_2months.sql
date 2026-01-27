-- =============================================
-- PAYmaki MOCK DATA SCRIPT
-- 2 Months Test Data (December 2024 - January 2025)
-- =============================================

-- ===================
-- 1. EMPLOYEES
-- ===================

-- Insert test employees (keeping existing structure)
INSERT INTO employees (id, name, email, phone, department, position, salary, status, start_date, role, avatar) VALUES
(gen_random_uuid(), 'Ahmet Yılmaz', 'ahmet.yilmaz@paymaki.com', '+90 532 111 2233', 'Yönetim', 'Genel Müdür', 25000, 'Active', '2020-01-15', 'general_manager', NULL),
(gen_random_uuid(), 'Ayşe Demir', 'ayse.demir@paymaki.com', '+90 532 222 3344', 'İnsan Kaynakları', 'İK Müdürü', 18000, 'Active', '2020-03-01', 'hr', NULL),
(gen_random_uuid(), 'Mehmet Kaya', 'mehmet.kaya@paymaki.com', '+90 532 333 4455', 'Satış', 'Satış Müdürü', 15000, 'Active', '2021-06-10', 'employee', NULL),
(gen_random_uuid(), 'Fatma Özkan', 'fatma.ozkan@paymaki.com', '+90 532 444 5566', 'Satış', 'Satış Temsilcisi', 12000, 'Active', '2022-01-20', 'employee', NULL),
(gen_random_uuid(), 'Can Çelik', 'can.celik@paymaki.com', '+90 532 555 6677', 'Pazarlama', 'Pazarlama Uzmanı', 13000, 'Active', '2022-05-15', 'employee', NULL),
(gen_random_uuid(), 'Zeynep Arslan', 'zeynep.arslan@paymaki.com', '+90 532 666 7788', 'Finans', 'Muhasebe Uzmanı', 11000, 'Active', '2021-09-01', 'employee', NULL),
(gen_random_uuid(), 'Burak Şahin', 'burak.sahin@paymaki.com', '+90 532 777 8899', 'Bilgi Teknolojileri', 'Yazılım Geliştirici', 16000, 'Active', '2020-11-20', 'employee', NULL),
(gen_random_uuid(), 'Elif Yıldız', 'elif.yildiz@paymaki.com', '+90 532 888 9900', 'Satış', 'Satış Temsilcisi', 11500, 'Active', '2023-02-10', 'employee', NULL),
(gen_random_uuid(), 'Serkan Aydın', 'serkan.aydin@paymaki.com', '+90 532 999 0011', 'Müşteri Hizmetleri', 'Müşteri Temsilcisi', 9500, 'Active', '2023-04-01', 'employee', NULL),
(gen_random_uuid(), 'Deniz Korkmaz', 'deniz.korkmaz@paymaki.com', '+90 532 000 1122', 'Pazarlama', 'Sosyal Medya Uzmanı', 10000, 'Active', '2023-07-15', 'employee', NULL)
ON CONFLICT (email) DO NOTHING;

-- ===================
-- 2. PAYROLLS - December 2024
-- ===================

INSERT INTO payrolls (employee_id, period, base_salary, earnings_details, deductions_details, net_pay, status, notes) 
SELECT 
  e.id,
  '2024-12',
  e.salary,
  jsonb_build_array(
    jsonb_build_object('label', 'Yemek Yardımı', 'value', 800),
    jsonb_build_object('label', 'Ulaşım', 'value', 500),
    jsonb_build_object('label', 'Performans Primi', 'value', CASE WHEN RANDOM() > 0.5 THEN 1000 ELSE 0 END)
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'SGK Kesintisi (%14)', 'value', e.salary * 0.14),
    jsonb_build_object('label', 'Gelir Vergisi (%20)', 'value', e.salary * 0.20),
    jsonb_build_object('label', 'Damga Vergisi', 'value', 50)
  ),
  e.salary + 1300 + CASE WHEN RANDOM() > 0.5 THEN 1000 ELSE 0 END - (e.salary * 0.34 + 50),
  CASE WHEN RANDOM() > 0.3 THEN 'Paid' ELSE 'Pending' END,
  'Aralık 2024 maaş bordrosu'
FROM employees e
WHERE e.status = 'Active';

-- ===================
-- 3. PAYROLLS - January 2025
-- ===================

INSERT INTO payrolls (employee_id, period, base_salary, earnings_details, deductions_details, net_pay, status, notes) 
SELECT 
  e.id,
  '2025-01',
  e.salary,
  jsonb_build_array(
    jsonb_build_object('label', 'Yemek Yardımı', 'value', 800),
    jsonb_build_object('label', 'Ulaşım', 'value', 500),
    jsonb_build_object('label', 'Yeni Yıl Primi', 'value', 1500)
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'SGK Kesintisi (%14)', 'value', e.salary * 0.14),
    jsonb_build_object('label', 'Gelir Vergisi (%20)', 'value', e.salary * 0.20),
    jsonb_build_object('label', 'Damga Vergisi', 'value', 50)
  ),
  e.salary + 2800 - (e.salary * 0.34 + 50),
  'Pending',
  'Ocak 2025 maaş bordrosu'
FROM employees e
WHERE e.status = 'Active';

-- ===================
-- 4. SALES - December 2024
-- ===================

-- Generate realistic sales data for December 2024
INSERT INTO sales (sale_date, product_name, amount, employee_id, created_by, notes) 
SELECT 
  DATE '2024-12-01' + (RANDOM() * 30)::integer,
  (ARRAY['Premium Paket', 'Standart Paket', 'Enterprise Çözüm', 'Danışmanlık Hizmeti', 'Yazılım Lisansı', 'Destek Paketi', 'Eğitim Programı', 'Cloud Aboneliği'])[FLOOR(RANDOM() * 8 + 1)],
  (5000 + RANDOM() * 45000)::numeric(10,2),
  (SELECT id FROM employees WHERE department IN ('Satış', 'Pazarlama') ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM employees WHERE department IN ('Satış', 'Pazarlama') ORDER BY RANDOM() LIMIT 1),
  'Aralık ayı satışı'
FROM generate_series(1, 50);

-- ===================
-- 5. SALES - January 2025
-- ===================

INSERT INTO sales (sale_date, product_name, amount, employee_id, created_by, notes) 
SELECT 
  DATE '2025-01-01' + (RANDOM() * 30)::integer,
  (ARRAY['Premium Paket', 'Standart Paket', 'Enterprise Çözüm', 'Danışmanlık Hizmeti', 'Yazılım Lisansı', 'Destek Paketi', 'Eğitim Programı', 'Cloud Aboneliği'])[FLOOR(RANDOM() * 8 + 1)],
  (5000 + RANDOM() * 45000)::numeric(10,2),
  (SELECT id FROM employees WHERE department IN ('Satış', 'Pazarlama') ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM employees WHERE department IN ('Satış', 'Pazarlama') ORDER BY RANDOM() LIMIT 1),
  'Ocak ayı satışı - Yeni yıl kampanyası'
FROM generate_series(1, 45);

-- ===================
-- 6. TIME LOGS - December 2024
-- ===================

-- Generate time logs for all active employees for December 2024 (weekdays only)
DO $$
DECLARE
  emp RECORD;
  log_date DATE;
BEGIN
  FOR emp IN SELECT id FROM employees WHERE status = 'Active' LOOP
    FOR log_date IN 
      SELECT generated_date FROM (
        SELECT generate_series(
          DATE '2024-12-01',
          DATE '2024-12-31',
          '1 day'::interval
        )::date AS generated_date
      ) AS dates
      WHERE EXTRACT(DOW FROM generated_date) NOT IN (0, 6) -- Skip weekends
    LOOP
      -- 90% attendance rate
      IF RANDOM() > 0.1 THEN
        INSERT INTO time_logs (employee_id, date, check_in, check_out, status, duration_minutes)
        VALUES (
          emp.id,
          log_date,
          (log_date + TIME '08:00:00' + (RANDOM() * INTERVAL '30 minutes'))::timestamp,
          (log_date + TIME '17:00:00' + (RANDOM() * INTERVAL '60 minutes'))::timestamp,
          CASE 
            WHEN RANDOM() > 0.95 THEN 'Late'
            ELSE 'Completed'
          END,
          480 + (RANDOM() * 60)::integer
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ===================
-- 7. TIME LOGS - January 2025
-- ===================

DO $$
DECLARE
  emp RECORD;
  log_date DATE;
BEGIN
  FOR emp IN SELECT id FROM employees WHERE status = 'Active' LOOP
    FOR log_date IN 
      SELECT generated_date FROM (
        SELECT generate_series(
          DATE '2025-01-01',
          DATE '2025-01-31',
          '1 day'::interval
        )::date AS generated_date
      ) AS dates
      WHERE EXTRACT(DOW FROM generated_date) NOT IN (0, 6) -- Skip weekends
    LOOP
      -- 90% attendance rate
      IF RANDOM() > 0.1 THEN
        INSERT INTO time_logs (employee_id, date, check_in, check_out, status, duration_minutes)
        VALUES (
          emp.id,
          log_date,
          (log_date + TIME '08:00:00' + (RANDOM() * INTERVAL '30 minutes'))::timestamp,
          (log_date + TIME '17:00:00' + (RANDOM() * INTERVAL '60 minutes'))::timestamp,
          CASE 
            WHEN RANDOM() > 0.95 THEN 'Late'
            ELSE 'Completed'
          END,
          480 + (RANDOM() * 60)::integer
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ===================
-- 8. LEAVE REQUESTS - December 2024 & January 2025
-- ===================

-- Generate realistic leave requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, created_at)
SELECT 
  e.id,
  (ARRAY['Yıllık İzin', 'Hastalık İzni', 'Mazeret İzni', 'Ücretsiz İzin'])[FLOOR(RANDOM() * 4 + 1)],
  DATE '2024-12-01' + (RANDOM() * 60)::integer,
  DATE '2024-12-01' + (RANDOM() * 60 + 1)::integer,
  (ARRAY['Aile ziyareti', 'Sağlık problemi', 'Kişisel işler', 'Tatil planı', 'Acil durum', 'Dinlenme ihtiyacı'])[FLOOR(RANDOM() * 6 + 1)],
  (ARRAY['Approved', 'Pending', 'Rejected'])[FLOOR(RANDOM() * 3 + 1)],
  NOW() - (RANDOM() * INTERVAL '60 days')
FROM employees e
WHERE e.status = 'Active'
AND RANDOM() > 0.6 -- 40% of employees request leave
UNION ALL
SELECT 
  e.id,
  (ARRAY['Yıllık İzin', 'Hastalık İzni', 'Mazeret İzni'])[FLOOR(RANDOM() * 3 + 1)],
  DATE '2024-12-20' + (RANDOM() * 20)::integer,
  DATE '2024-12-20' + (RANDOM() * 20 + 2)::integer,
  (ARRAY['Yeni yıl tatili', 'Aile toplantısı', 'Sağlık kontrolü'])[FLOOR(RANDOM() * 3 + 1)],
  (ARRAY['Approved', 'Pending'])[FLOOR(RANDOM() * 2 + 1)],
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM employees e
WHERE e.status = 'Active'
AND RANDOM() > 0.7; -- Additional 30% request leave during holidays

-- ===================
-- 9. CALENDAR EVENTS
-- ===================

INSERT INTO calendar_events (start_date, title, type, description) VALUES
-- December 2024 Events
('2024-12-05', 'Şirket Toplantısı', 'Toplantı', 'Aylık değerlendirme toplantısı'),
('2024-12-15', 'Satış Eğitimi', 'Eğitim', 'Yeni ürün eğitim semineri'),
('2024-12-20', 'Yılbaşı Partisi', 'Etkinlik', 'Yıl sonu kutlama etkinliği'),
('2024-12-24', 'Yarım Gün', 'Tatil', 'Yılbaşı arifesi yarım gün mesai'),
('2024-12-25', 'Resmi Tatil', 'Tatil', 'Noel'),
('2024-12-31', 'Yılbaşı Arifesi', 'Tatil', 'Yılbaşı kutlaması'),

-- January 2025 Events
('2025-01-01', 'Yılbaşı', 'Tatil', 'Resmi tatil'),
('2025-01-10', 'Çeyrek Değerlendirme', 'Toplantı', 'Q4 2024 sonuçları'),
('2025-01-15', 'Performans Görüşmeleri', 'Toplantı', 'Yıllık performans değerlendirmesi başlangıcı'),
('2025-01-20', 'İK Bilgilendirme', 'Eğitim', 'Yan haklar ve maaş politikaları'),
('2025-01-25', 'Ekip Toplantısı', 'Toplantı', '2025 hedefleri belirleme'),
('2025-01-31', 'Son Gün', 'Önemli', 'Ocak ayı raporlama son günü');

-- ===================
-- 10. COMPANY SETTINGS
-- ===================

INSERT INTO company_settings (id, company_name, probation_months, company_logo) 
VALUES (1, 'Paymaki HR Solutions', 3, NULL)
ON CONFLICT (id) DO UPDATE 
SET probation_months = EXCLUDED.probation_months;

-- ===================
-- SUMMARY & VERIFICATION
-- ===================

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'MOCK DATA LOADING COMPLETED';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Employees: %', (SELECT COUNT(*) FROM employees WHERE status = 'Active');
  RAISE NOTICE 'Payrolls (Dec 2024): %', (SELECT COUNT(*) FROM payrolls WHERE period = '2024-12');
  RAISE NOTICE 'Payrolls (Jan 2025): %', (SELECT COUNT(*) FROM payrolls WHERE period = '2025-01');
  RAISE NOTICE 'Sales (Dec 2024): %', (SELECT COUNT(*) FROM sales WHERE sale_date >= '2024-12-01' AND sale_date < '2025-01-01');
  RAISE NOTICE 'Sales (Jan 2025): %', (SELECT COUNT(*) FROM sales WHERE sale_date >= '2025-01-01' AND sale_date < '2025-02-01');
  RAISE NOTICE 'Time Logs (Dec 2024): %', (SELECT COUNT(*) FROM time_logs WHERE date >= '2024-12-01' AND date < '2025-01-01');
  RAISE NOTICE 'Time Logs (Jan 2025): %', (SELECT COUNT(*) FROM time_logs WHERE date >= '2025-01-01' AND date < '2025-02-01');
  RAISE NOTICE 'Leave Requests: %', (SELECT COUNT(*) FROM leave_requests);
  RAISE NOTICE 'Calendar Events: %', (SELECT COUNT(*) FROM calendar_events);
  RAISE NOTICE '=================================';
END $$;
