-- =============================================
-- PAYLORA DATABASE OPTIMIZATION SCRIPT
-- Performance enhancements through indexing
-- and foreign key optimizations
-- =============================================

-- ===================
-- 1. INDEXES
-- ===================

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- Payrolls table indexes
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON payrolls(period);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_period ON payrolls(employee_id, period);

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_employee_date ON sales(employee_id, sale_date);

-- Time logs indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
CREATE INDEX IF NOT EXISTS idx_time_logs_employee_id ON time_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_employee_date ON time_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_logs_status ON time_logs(status);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(end_date);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- Deletion requests indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_target_id ON deletion_requests(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);

-- ===================
-- 2. FOREIGN KEY CASCADE DELETE
-- ===================

-- Drop existing foreign keys if they exist
ALTER TABLE payrolls DROP CONSTRAINT IF EXISTS payrolls_employee_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_employee_id_fkey;
ALTER TABLE time_logs DROP CONSTRAINT IF EXISTS time_logs_employee_id_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;
ALTER TABLE deletion_requests DROP CONSTRAINT IF EXISTS deletion_requests_target_employee_id_fkey;
ALTER TABLE deletion_requests DROP CONSTRAINT IF EXISTS deletion_requests_requester_id_fkey;

-- Add foreign keys with CASCADE DELETE
ALTER TABLE payrolls 
  ADD CONSTRAINT payrolls_employee_id_fkey 
  FOREIGN KEY (employee_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

ALTER TABLE sales 
  ADD CONSTRAINT sales_employee_id_fkey 
  FOREIGN KEY (employee_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

ALTER TABLE time_logs 
  ADD CONSTRAINT time_logs_employee_id_fkey 
  FOREIGN KEY (employee_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

ALTER TABLE leave_requests 
  ADD CONSTRAINT leave_requests_employee_id_fkey 
  FOREIGN KEY (employee_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

ALTER TABLE deletion_requests 
  ADD CONSTRAINT deletion_requests_target_employee_id_fkey 
  FOREIGN KEY (target_employee_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

ALTER TABLE deletion_requests 
  ADD CONSTRAINT deletion_requests_requester_id_fkey 
  FOREIGN KEY (requester_id) 
  REFERENCES employees(id) 
  ON DELETE SET NULL;

-- ===================
-- 3. QUERY OPTIMIZATION
-- ===================

-- Analyze tables for query planner statistics
ANALYZE employees;
ANALYZE payrolls;
ANALYZE sales;
ANALYZE time_logs;
ANALYZE leave_requests;
ANALYZE calendar_events;
ANALYZE deletion_requests;

-- ===================
-- 4. PERFORMANCE VIEWS (Optional)
-- ===================

-- Create a materialized view for frequently accessed employee statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_stats AS
SELECT 
  e.id,
  e.name,
  e.department,
  e.position,
  COUNT(DISTINCT p.id) as payroll_count,
  COUNT(DISTINCT s.id) as sales_count,
  COUNT(DISTINCT tl.id) as time_log_count,
  COUNT(DISTINCT lr.id) as leave_request_count,
  COALESCE(SUM(s.amount), 0) as total_sales_amount
FROM employees e
LEFT JOIN payrolls p ON e.id = p.employee_id
LEFT JOIN sales s ON e.id = s.employee_id
LEFT JOIN time_logs tl ON e.id = tl.employee_id
LEFT JOIN leave_requests lr ON e.id = lr.employee_id
WHERE e.status = 'Active'
GROUP BY e.id, e.name, e.department, e.position;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_employee_stats_id ON employee_stats(id);

-- Refresh command (run periodically or trigger-based)
-- REFRESH MATERIALIZED VIEW employee_stats;

-- ===================
-- 5. CLEANUP & MAINTENANCE
-- ===================

-- Remove duplicate indexes if any exist
-- (PostgreSQL automatically handles this, but good practice)

-- Vacuum analyze for performance
-- NOTE: VACUUM cannot run inside a transaction block. Run these separately after main script.
-- VACUUM ANALYZE employees;
-- VACUUM ANALYZE payrolls;
-- VACUUM ANALYZE sales;
-- VACUUM ANALYZE time_logs;
-- VACUUM ANALYZE leave_requests;
-- VACUUM ANALYZE calendar_events;

-- ===================
-- EXECUTION NOTES
-- ===================
/*
1. Run this script in Supabase SQL Editor
2. Foreign key changes may require table updates if there are orphaned records
3. Materialized view refresh should be scheduled (hourly/daily based on usage)
4. Monitor query performance using Supabase Performance Insights
5. Index maintenance is automatic in PostgreSQL but monitor sizes

RECOMMENDED REFRESH SCHEDULE:
- employee_stats materialized view: Daily at midnight
- ANALYZE tables: Weekly
- VACUUM ANALYZE: Monthly or when significant data changes occur
*/



