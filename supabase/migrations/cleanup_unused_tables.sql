-- ============================================================================
-- DATABASE CLEANUP SCRIPT
-- ============================================================================
-- Bu script gereksiz/yanlışlıkla oluşturulmuş tabloları temizler
-- Tarih: 29 Ocak 2026
-- ============================================================================

-- ÖNCE MEVCUT TABLOLARI KONTROL ET
-- Supabase SQL Editor'da bu sorguyu çalıştırın:
/*
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
*/

-- ============================================================================
-- GEREKSIZ TABLOLARI SİL (Eğer varsa)
-- ============================================================================

-- Yanlışlıkla eklenen "enhanced" veya "automation" tabloları
DROP TABLE IF EXISTS payrolls_enhanced CASCADE;
DROP TABLE IF EXISTS payroll_periods CASCADE;
DROP TABLE IF EXISTS payroll_earnings_details CASCADE;
DROP TABLE IF EXISTS payroll_deductions_details CASCADE;
DROP TABLE IF EXISTS payroll_audit_log CASCADE;
DROP TABLE IF EXISTS payroll_config_audit_log CASCADE;
DROP TABLE IF EXISTS overtime_rules CASCADE;
DROP TABLE IF EXISTS overtime_rules_history CASCADE;
DROP TABLE IF EXISTS leave_records_enhanced CASCADE;

-- Gereksiz view'lar (eğer varsa)
DROP VIEW IF EXISTS payroll_complete_view CASCADE;
DROP VIEW IF EXISTS leave_summary_view CASCADE;

-- Gereksiz fonksiyonlar (eğer varsa)
DROP FUNCTION IF EXISTS validate_employee_import(jsonb) CASCADE;
DROP FUNCTION IF EXISTS check_overlapping_leaves(uuid, date, date, uuid) CASCADE;
DROP FUNCTION IF EXISTS update_payroll_timestamp() CASCADE;
DROP FUNCTION IF EXISTS log_payroll_change() CASCADE;

-- ============================================================================
-- DOĞRU TABLOLARIN MEVCUT OLDUĞUNU KONTROL ET
-- ============================================================================

-- Gerekli temel tablolar (bunlar kalmalı):
-- ✓ employees
-- ✓ payrolls
-- ✓ attendance
-- ✓ leave_records
-- ✓ sales
-- ✓ time_logs
-- ✓ leave_requests
-- ✓ calendar_events
-- ✓ deletion_requests
-- ✓ company_settings

-- Kontrol sorgusu:
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') 
        THEN '✓ employees' 
        ELSE '✗ employees MISSING!' 
    END as employees_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payrolls') 
        THEN '✓ payrolls' 
        ELSE '✗ payrolls MISSING!' 
    END as payrolls_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance') 
        THEN '✓ attendance' 
        ELSE '✗ attendance MISSING!' 
    END as attendance_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_records') 
        THEN '✓ leave_records' 
        ELSE '✗ leave_records MISSING!' 
    END as leave_records_check;

-- ============================================================================
-- CLEANUP TAMAMLANDI
-- ============================================================================

-- Şimdi tek geçerli migration dosyanız şu olmalı:
-- → supabase/migrations/add_attendance_system.sql

-- Bu dosyayı çalıştırmak için:
-- 1. Supabase Dashboard → SQL Editor
-- 2. Bu dosyanın içeriğini yapıştır
-- 3. "Run" tıkla
-- 4. Sonra add_attendance_system.sql'i tekrar çalıştır

-- ============================================================================
