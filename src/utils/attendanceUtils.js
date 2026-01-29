// Attendance ve Payroll Calculation Utilities
import { supabase } from '../supabase';

/**
 * Clock In/Out bir çalışanı sisteme ekler veya günceller
 * @param {UUID} employeeId - Çalışan ID'si
 * @param {string} action - 'in' veya 'out'
 * @returns {Promise<Object>}
 */
export const recordAttendance = async (employeeId, action = 'in') => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (action === 'in') {
      // Giriş kaydı ekle
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            employee_id: employeeId,
            clock_in: now.toISOString(),
            date: today,
          },
        ])
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } else if (action === 'out') {
      // Çıkış kaydını güncelle
      const { data: existingData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .is('clock_out', null)
        .single();
      
      if (!existingData) {
        throw new Error('Bugün giriş kaydı bulunamadı');
      }
      
      const clockInTime = new Date(existingData.clock_in);
      const clockOutTime = now;
      const workedHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      
      const { data, error } = await supabase
        .from('attendance')
        .update({
          clock_out: now.toISOString(),
          worked_hours: parseFloat(workedHours.toFixed(2)),
        })
        .eq('id', existingData.id)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error) {
    console.error('Attendance kaydı hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bir dönem için çalışılan saatleri hesapla
 * @param {UUID} employeeId
 * @param {string} period - Format: 'YYYY-MM' (örn: '2026-01')
 * @returns {Promise<Object>}
 */
export const calculateWorkedHoursForPeriod = async (employeeId, period) => {
  try {
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, parseInt(month), 0)
      .toISOString()
      .split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('worked_hours')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .gt('worked_hours', 0);
    
    if (error) throw error;
    
    const totalHours = data.reduce((sum, row) => sum + (row.worked_hours || 0), 0);
    const workedDays = data.length;
    
    return {
      success: true,
      worked_hours: parseFloat(totalHours.toFixed(2)),
      worked_days: workedDays,
    };
  } catch (error) {
    console.error('Çalışılan saat hesaplama hatası:', error);
    return {
      success: false,
      worked_hours: 0,
      worked_days: 0,
      error: error.message,
    };
  }
};

/**
 * Bir dönem için onaylı izinleri getir
 * @param {UUID} employeeId
 * @param {string} period - Format: 'YYYY-MM'
 * @returns {Promise<Array>}
 */
export const getApprovedLeavesForPeriod = async (employeeId, period) => {
  try {
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, parseInt(month), 0)
      .toISOString()
      .split('T')[0];
    
    const { data, error } = await supabase
      .from('leave_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'Approved')
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('İzin kayıtları getirme hatası:', error);
    return [];
  }
};

/**
 * Saat bazlı maaş hesapla
 * @param {number} hourlyRate - Saatlik ücret
 * @param {number} workedHours - Çalışılan saat
 * @param {number} baseSalary - Temel aylık maaş (referans için)
 * @returns {number}
 */
export const calculateHourlyPayment = (hourlyRate, workedHours, baseSalary) => {
  if (!hourlyRate && baseSalary) {
    // Eğer saatlik ücret belirtilmemişse, temel maaştan hesapla (160 saat/ay)
    const calculatedHourly = baseSalary / 160;
    return workedHours * calculatedHourly;
  }
  return workedHours * hourlyRate;
};

/**
 * Kesinti hesapla (SGK, Vergi, vb.) - saat bazlı
 * @param {number} grossPay - Brüt ücret
 * @param {number} deductionPercent - Kesinti yüzdesi
 * @returns {number}
 */
export const calculateDeduction = (grossPay, deductionPercent) => {
  return (grossPay * deductionPercent) / 100;
};

/**
 * Eksiksiz payroll hesapla
 * @param {Object} payroll - Payroll objesi
 * @param {Object} attendanceData - { worked_hours, worked_days, leave_records }
 * @returns {Object} - Tam hesaplanmış payroll
 */
export const calculateCompletePayroll = (payroll, attendanceData = {}) => {
  const workedHours = attendanceData.worked_hours || payroll.worked_hours || 160;
  const workedDays = attendanceData.worked_days || payroll.worked_days || 20;
  const leaveRecords = attendanceData.leave_records || payroll.leave_details || [];
  
  const baseSalary = payroll.base_salary || 0;
  const hourlyRate = payroll.hourly_rate || baseSalary / 160;
  
  // Saat bazlı hesaplama
  const hourlyPayment = calculateHourlyPayment(hourlyRate, workedHours, baseSalary);
  
  // Ek kazançları hesapla
  const calculateItemAmount = (item, salary) => {
    const val = parseFloat(item.value) || 0;
    return item.type === 'percent' ? (salary * val) / 100 : val;
  };
  
  const totalEarnings = (payroll.earnings_details || []).reduce(
    (acc, item) => acc + calculateItemAmount(item, baseSalary),
    0
  );
  
  // Kesintileri hesapla
  let legalDeductions = 0;
  let specialDeductions = 0;
  
  if (payroll.deductions_details && payroll.deductions_details.length > 0) {
    payroll.deductions_details.forEach(item => {
      const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word =>
        item.name.includes(word)
      );
      const amount = calculateItemAmount(item, baseSalary);
      
      if (isLegal) {
        legalDeductions += amount;
      } else {
        specialDeductions += amount;
      }
    });
  }
  
  const totalDeductions = legalDeductions + specialDeductions;
  const netPay = hourlyPayment + totalEarnings - totalDeductions;
  
  return {
    ...payroll,
    worked_hours: workedHours,
    worked_days: workedDays,
    leave_details: leaveRecords,
    hourly_rate: hourlyRate,
    hourly_payment: parseFloat(hourlyPayment.toFixed(2)),
    total_earnings: parseFloat(totalEarnings.toFixed(2)),
    legal_deductions: parseFloat(legalDeductions.toFixed(2)),
    special_deductions: parseFloat(specialDeductions.toFixed(2)),
    total_deductions: parseFloat(totalDeductions.toFixed(2)),
    net_pay: parseFloat(netPay.toFixed(2)),
  };
};

/**
 * Payroll güncelle - attendance verilerini otomatik olarak ekle
 * @param {UUID} payrollId
 * @param {UUID} employeeId
 * @param {string} period - Format: 'YYYY-MM'
 * @returns {Promise<Object>}
 */
export const updatePayrollWithAttendance = async (payrollId, employeeId, period) => {
  try {
    // Çalışılan saat ve günleri hesapla
    const attendanceResult = await calculateWorkedHoursForPeriod(employeeId, period);
    
    // İzinleri getir
    const leaves = await getApprovedLeavesForPeriod(employeeId, period);
    
    // Payroll güncelle
    const { data, error } = await supabase
      .from('payrolls')
      .update({
        worked_hours: attendanceResult.worked_hours,
        worked_days: attendanceResult.worked_days,
        leave_details: leaves,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payrollId)
      .select();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Payroll güncelleme hatası:', error);
    return { success: false, error: error.message };
  }
};
