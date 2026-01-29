-- Clock In/Out Table (Giriş/Çıkış Kayıtları)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  worked_hours DECIMAL(5, 2),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leave Details Table (İzin Detayları)
CREATE TABLE IF NOT EXISTS leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50), -- 'annual', 'sick', 'unpaid', 'maternity', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'Pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update Payrolls Table to add work metrics
ALTER TABLE payrolls 
ADD COLUMN IF NOT EXISTS worked_days DECIMAL(5, 2) DEFAULT 20,
ADD COLUMN IF NOT EXISTS worked_hours DECIMAL(7, 2) DEFAULT 160,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS attendance_notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_records_employee_date ON leave_records(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_period ON payrolls(employee_id, period);

-- Function to calculate worked hours for a payroll period
CREATE OR REPLACE FUNCTION calculate_worked_hours(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_total_hours DECIMAL(7, 2);
BEGIN
  SELECT COALESCE(SUM(worked_hours), 0)
  INTO v_total_hours
  FROM attendance
  WHERE employee_id = p_employee_id
    AND date BETWEEN p_start_date AND p_end_date
    AND worked_hours > 0;
  
  RETURN v_total_hours;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate worked days for a payroll period
CREATE OR REPLACE FUNCTION calculate_worked_days(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_worked_days DECIMAL(5, 2);
BEGIN
  SELECT COUNT(DISTINCT date)
  INTO v_worked_days
  FROM attendance
  WHERE employee_id = p_employee_id
    AND date BETWEEN p_start_date AND p_end_date
    AND worked_hours > 0;
  
  RETURN COALESCE(v_worked_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get leave days for a payroll period
CREATE OR REPLACE FUNCTION get_leave_details(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  leave_type VARCHAR,
  days DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.leave_type::VARCHAR,
    COALESCE(lr.days, 0)::DECIMAL
  FROM leave_records lr
  WHERE lr.employee_id = p_employee_id
    AND lr.status = 'Approved'
    AND lr.start_date <= p_end_date
    AND lr.end_date >= p_start_date
  GROUP BY lr.leave_type, lr.days;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MOCK DATA - Sınama İçin Örnek Veriler
-- ==========================================

-- Mock Clock In/Out Verileri (Ocak 2026 - Her gün 8 saat)
INSERT INTO attendance (employee_id, clock_in, clock_out, worked_hours, date, notes)
SELECT 
  e.id,
  (DATE '2026-01-01' + (i || ' days')::INTERVAL)::timestamp + INTERVAL '9 hours',
  (DATE '2026-01-01' + (i || ' days')::INTERVAL)::timestamp + INTERVAL '17 hours',
  8.0,
  DATE '2026-01-01' + (i || ' days')::INTERVAL,
  'Düzenli çalışma günü'
FROM employees e
CROSS JOIN GENERATE_SERIES(0, 19) AS i
WHERE EXTRACT(DOW FROM DATE '2026-01-01' + (i || ' days')::INTERVAL) NOT IN (0, 6)
ON CONFLICT DO NOTHING;

-- Mock Leave Records (İzin Kayıtları) - Ocak 2026 içinde
-- Her çalışana 2 farklı izin tipi ekle
WITH employee_leaves AS (
  SELECT 
    e.id as employee_id,
    e.name,
    'Yillik Izin' as leave_type,
    DATE '2026-01-15' as start_date,
    DATE '2026-01-17' as end_date,
    3.0 as days,
    'Approved' as status,
    'Yıllık izin kullanımı' as reason
  FROM employees e
  UNION ALL
  SELECT 
    e.id as employee_id,
    e.name,
    'Hastalik Izni' as leave_type,
    DATE '2026-01-08' as start_date,
    DATE '2026-01-09' as end_date,
    2.0 as days,
    'Approved' as status,
    'Sağlık raporu ile hastalık izni' as reason
  FROM employees e
  WHERE e.name ILIKE '%demir%' OR e.name ILIKE '%yilmaz%'
)
INSERT INTO leave_records (employee_id, leave_type, start_date, end_date, days, status, reason)
SELECT employee_id, leave_type, start_date, end_date, days, status, reason
FROM employee_leaves
ON CONFLICT DO NOTHING;
