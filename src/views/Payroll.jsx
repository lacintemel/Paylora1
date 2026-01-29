import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    DollarSign, Calendar, FileText, Plus, Search, Loader2, 
    CreditCard, XCircle, Printer, Clock, Save, Edit3,
    TrendingUp, TrendingDown, Briefcase, Building, PlusCircle, Trash2,
    ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper';
import { exportPayrollToPDF, exportPayrollToPDF_Summary, exportPayrollToPDF_Detailed } from '../utils/exportUtils';
import { showSuccess, showError } from '../utils/toast';
import { calculateWorkedHoursForPeriod, getApprovedLeavesForPeriod, calculateCompletePayroll, updatePayrollWithAttendance, recordAttendance } from '../utils/attendanceUtils';

export default function Payroll({ userRole, currentUserId }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [searchTerm, setSearchTerm] = useState('');

  // DETAY MODALI STATE
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ days: 0, hours: 0, overtime: 0 });

  // ⚡ GELİŞMİŞ EDİTÖR STATE
  const [baseSalary, setBaseSalary] = useState(0);
  const [earningsList, setEarningsList] = useState([]);
  const [deductionsList, setDeductionsList] = useState([]);
  const [note, setNote] = useState('');
  const [editingItem, setEditingItem] = useState(null); // Seçili item: {type: 'earnings'|'deductions', index: number}

  // EXPORT DIALOG STATE
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState(null); // 'bulk' veya 'single'

  const isManager = ['general_manager', 'hr'].includes(userRole);

  // --- VARSAYILAN KATEGORİLER ---
  const DEFAULT_EARNINGS = [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
  ];

  const DEFAULT_DEDUCTIONS = [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 }, 
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 }, 
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 }, 
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 }, 
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
  ];

  useEffect(() => { fetchPayrolls(); }, [selectedMonth]);

  const shiftMonth = (delta) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payrolls')
        .select(`*, employees ( id, name, avatar, department, position, salary )`)
        .eq('period', selectedMonth)
        .order('status', { ascending: false });

      if (!isManager && currentUserId) {
        query = query.eq('employee_id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) { 
      console.error("Veri hatası:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 🧮 HESAPLAMA MOTORLARI ---
  
  // 1. Yardımcı: Tekil Kalem Hesapla
  const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      return item.type === 'percent' ? (salary * val) / 100 : val;
  };

  // Yıllık maaşı aylığa çevir
  const getMonthlyBaseSalary = (annualSalary) => (parseFloat(annualSalary) || 0) / 12;

  // 2. Tablo Satırı İçin Özet Hesapla (Database'deki worked_hours kullanarak)
  const calculateRowSummary = (payroll) => {
      const base = payroll.base_salary || 0;
      const monthlyBase = getMonthlyBaseSalary(base);
      
      // Eğer worked_hours varsa onu kullan, yoksa 160 (tam ay)
      const workedHours = payroll.worked_hours || 160;
      const hourlyRate = monthlyBase / 160;
      const grossSalary = workedHours * hourlyRate;
      
      // JSON listelerini topla (brüt maaş üzerinden)
      const totalEarnings = (payroll.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, grossSalary), 0);
      
      let legalDeductions = 0;
      let specialDeductions = 0;
      
      if (payroll.deductions_details && payroll.deductions_details.length > 0) {
        payroll.deductions_details.forEach(item => {
          const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
          const amount = calculateItemAmount(item, grossSalary);
          if (isLegal) {
            legalDeductions += amount;
          } else {
            specialDeductions += amount;
          }
        });
      }
      
      const totalDeductions = legalDeductions + specialDeductions;
      const net = grossSalary + totalEarnings - totalDeductions;
      
      return {
          gross: grossSalary,
          totalEarnings,
          legalDeductions,
          specialDeductions,
          totalDeductions,
          net
      };
  };

  // 3. Editör Modalı İçin Canlı Hesapla (State verisinden)
  const calculateEditorTotals = () => {
      const monthlyBase = getMonthlyBaseSalary(baseSalary);
      const hourlyRate = monthlyBase / 160 || 0;
      const workedHours = attendanceStats.hours || 160;
      const gross = workedHours * hourlyRate;
      
      const totalEarnings = earningsList.reduce((acc, item) => acc + calculateItemAmount(item, gross), 0);
      
      let legalDeductions = 0;
      let specialDeductions = 0;
      
      deductionsList.forEach(item => {
        const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
        const amount = calculateItemAmount(item, gross);
        if (isLegal) {
          legalDeductions += amount;
        } else {
          specialDeductions += amount;
        }
      });
      
      const totalDeductions = legalDeductions + specialDeductions;
      const net = gross + totalEarnings - totalDeductions;
      
      return {
          gross,
          totalEarnings,
          legalDeductions,
          specialDeductions,
          totalDeductions,
          net
      };
  };

  // --- VERİTABANI İŞLEMLERİ ---

  // ÖDEME YAP / İPTAL ET (TABLODAKİ BUTONLAR İÇİN)
  const togglePaymentStatus = async (id, currentStatus) => {
      if (!isManager) return;
      const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
      const confirmMsg = newStatus === 'Paid' ? 'Ödemeyi ONAYLIYOR musunuz?' : 'Ödemeyi İPTAL EDİYOR musunuz?';
      
      if (!confirm(confirmMsg)) return;

      try {
          const { error } = await supabase.from('payrolls').update({ status: newStatus }).eq('id', id);
          if (error) throw error;
          
          // Listeyi güncelle (Sayfa yenilemeden)
          setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
          if (selectedPayroll && selectedPayroll.id === id) setSelectedPayroll(prev => ({ ...prev, status: newStatus }));
          
          showSuccess(`İşlem Başarılı: ${newStatus === 'Paid' ? 'Ödendi' : 'İptal Edildi'}`);
      } catch (error) { showError("Hata: " + error.message); }
  };
  
  const handleSaveChanges = async () => {
      if (!isManager) return;
      if (!confirm("Bordro güncellemeleri kaydedilsin mi?")) return;

      try {
          const totals = calculateEditorTotals();

          const { error } = await supabase.from('payrolls').update({
              base_salary: baseSalary,
              earnings_details: earningsList,
              deductions_details: deductionsList,
              net_pay: totals.net, // Hızlı sorgu için net tutarı da ayrıca güncelleyelim
              notes: note
          }).eq('id', selectedPayroll.id);

          if (error) throw error;
          showSuccess("Bordro Güncellendi! ✅");
          setIsDetailOpen(false);
          fetchPayrolls();
      } catch (error) { showError("Hata: " + error.message); }
  };

  // Otomatik Oluşturucu - Attendance ve Leave verisiyle bordro hesapla
  const generatePayrollsForMonth = async () => {
    if (!confirm("Otomatik bordro oluşturulsun mu?")) return;
    setLoading(true);
    try {
        const { data: employees } = await supabase.from('employees').select('*').eq('status', 'Active');
        console.log('Çalışanlar:', employees);
        
        for (const emp of employees) {
            // Attendance verilerini çek
            const attendanceResult = await calculateWorkedHoursForPeriod(emp.id, selectedMonth);
            const leaveRecords = await getApprovedLeavesForPeriod(emp.id, selectedMonth);
            
            // Çalışılan saat ve gün
            const workedHours = attendanceResult.worked_hours || 0;
            const workedDays = attendanceResult.worked_days || 0;
            
            // İzin günlerini hesapla
            const totalLeaveDays = leaveRecords.reduce((sum, leave) => sum + (leave.days || 0), 0);
            
            // Saatlik ücret hesapla (Yıllık maaş / 12 / 160 saat)
            const monthlyBase = getMonthlyBaseSalary(emp.salary || 0);
            const hourlyRate = monthlyBase / 160;
            
            // Brüt maaş = Saatlik ücret × Çalışılan saat
            const grossSalary = workedHours * hourlyRate;
            
            // Kesintileri hesapla
            const calculateItemAmount = (item, salary) => {
              const val = parseFloat(item.value) || 0;
              return item.type === 'percent' ? (salary * val) / 100 : val;
            };
            
            let legalDeductions = 0;
            let specialDeductions = 0;
            
            DEFAULT_DEDUCTIONS.forEach(item => {
              const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
              const amount = calculateItemAmount(item, grossSalary);
              
              if (isLegal) {
                legalDeductions += amount;
              } else {
                specialDeductions += amount;
              }
            });
            
            // Kazançlar
            const totalEarnings = DEFAULT_EARNINGS.reduce((sum, item) => sum + calculateItemAmount(item, grossSalary), 0);
            
            // Net maaş
            const netPay = grossSalary + totalEarnings - (legalDeductions + specialDeductions);
            
            // Bordro verisini hazırla
            const payrollData = {
                employee_id: emp.id,
                period: selectedMonth,
                base_salary: emp.salary,
                worked_days: workedDays,
                worked_hours: workedHours,
                hourly_rate: parseFloat(hourlyRate.toFixed(2)),
                earnings_details: DEFAULT_EARNINGS,
                deductions_details: DEFAULT_DEDUCTIONS,
                leave_details: leaveRecords,
                attendance_notes: `${workedDays} gün, ${workedHours} saat çalışıldı. ${totalLeaveDays} gün izin kullanıldı.`,
                status: 'Pending',
                net_pay: parseFloat(netPay.toFixed(2))
            };
            
            console.log(`${emp.name} için bordro:`, payrollData);
            
            // Önce bak, varsa güncelle, yoksa ekle
            const { data: existing } = await supabase
                .from('payrolls')
                .select('id')
                .eq('employee_id', emp.id)
                .eq('period', selectedMonth)
                .single();
            
            if (existing) {
                // Güncelle
                const { data, error } = await supabase
                    .from('payrolls')
                    .update(payrollData)
                    .eq('id', existing.id);
                console.log(`Update sonuç (${existing.id}):`, data, error);
            } else {
                // Ekle
                const { data, error } = await supabase
                    .from('payrolls')
                    .insert(payrollData);
                console.log('Insert sonuç:', data, error);
            }
        }
        
        fetchPayrolls();
        showSuccess('Bordro otomatik oluşturuldu! ✅ Attendance ve izin verileri kullanıldı.');
    } catch (error) { 
        console.error('Full error:', error);
        showError("Hata: " + error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- MODAL AÇMA VE VERİ HAZIRLAMA ---
  const openDetailModal = async (payroll) => {
      try {
        // Attendance verilerini çek
        const attendanceResult = await calculateWorkedHoursForPeriod(payroll.employee_id, selectedMonth);
        const leaveRecords = await getApprovedLeavesForPeriod(payroll.employee_id, selectedMonth);
        
        // Attendance stats'ı ayarla
        setAttendanceStats({
          days: attendanceResult.worked_days || payroll.worked_days || 20,
          hours: attendanceResult.worked_hours || payroll.worked_hours || 160,
          overtime: Math.max(0, (attendanceResult.worked_hours || 0) - 160),
          leaves: leaveRecords
        });
        
        console.log('Opening payroll:', payroll);
        console.log('Attendance data:', attendanceResult);
        console.log('Leave records:', leaveRecords);
        
        setSelectedPayroll(payroll);
        setBaseSalary(payroll.base_salary || payroll.employees?.salary || 0);
        setEarningsList(payroll.earnings_details && payroll.earnings_details.length > 0 ? payroll.earnings_details : DEFAULT_EARNINGS);
        setDeductionsList(payroll.deductions_details && payroll.deductions_details.length > 0 ? payroll.deductions_details : DEFAULT_DEDUCTIONS);
        setNote(payroll.notes || '');
        setEditingItem(null);
        setIsDetailOpen(true);
      } catch (error) {
        console.error('Modal açma hatası:', error);
        showError('Veriler yüklenemedi: ' + error.message);
      }
  };

  // --- DİNAMİK LİSTE YÖNETİMİ ---
  const updateItem = (listType, index, field, value) => {
      const setter = listType === 'earnings' ? setEarningsList : setDeductionsList;
      setter(prev => {
          const newList = [...prev];
          newList[index] = { ...newList[index], [field]: value };
          return newList;
      });
  };

  const addItem = (listType) => {
      const newItem = { id: Date.now(), name: '', type: 'fixed', value: 0, isCustom: true };
      if (listType === 'earnings') setEarningsList([...earningsList, newItem]);
      else setDeductionsList([...deductionsList, newItem]);
  };

  const removeItem = (listType, index) => {
      if (listType === 'earnings') setEarningsList(prev => prev.filter((_, i) => i !== index));
      else setDeductionsList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-600"/> Bordro Yönetimi</h1>
            <p className="text-gray-500 text-sm">{selectedMonth} Dönemi</p>
         </div>
            <div className="flex gap-3 items-center">
                 {isManager && <button onClick={generatePayrollsForMonth} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus className="w-4 h-4"/> Oluştur</button>}
                 <button onClick={() => { setExportMode('bulk'); setIsExportDialogOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Download className="w-4 h-4"/> İndir</button>
                 <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 shadow-sm">
                     <button onClick={() => shiftMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" aria-label="Önceki ay">
                         <ChevronLeft className="w-4 h-4" />
                     </button>
                     <div className="relative">
                         <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                         <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="pl-9 pr-4 py-2 border rounded-xl text-sm font-bold" />
                     </div>
                     <button onClick={() => shiftMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" aria-label="Sonraki ay">
                         <ChevronRight className="w-4 h-4" />
                     </button>
                 </div>
            </div>
      </div>

      <div className="relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"/><input type="text" placeholder="Personel ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl"/></div>

      {/* --- ANA TABLO (GÜNCELLENMİŞ HALİ) --- */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Personel</th>
                     <th className="p-4 font-bold">Yıllık Maaş</th>
                     <th className="p-4 font-bold">Aylık Maaş</th>
                     <th className="p-4 font-bold text-green-600">Bonus (+)</th>
                     <th className="p-4 font-bold text-red-600">Kesinti (-)</th>
                     <th className="p-4 font-bold">Net</th>
                     <th className="p-4 font-bold">Durum</th>
                     <th className="p-4 text-right">İşlem</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="8" className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr> : 
                  payrolls.filter(p => p.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((payroll) => {
                     
                     // 🔥 HER SATIR İÇİN ÖZETİ HESAPLA
                     const summary = calculateRowSummary(payroll);
                     const annualSalary = parseInt(payroll.base_salary || 0); // Tam sayı - kuruş at
                     const monthlySalary = parseInt(getMonthlyBaseSalary(payroll.base_salary || 0));

                     return (
                     <tr key={payroll.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm border border-white">
                                {isValidImageUrl(payroll.employees?.avatar) ? <img src={payroll.employees.avatar} className="w-full h-full rounded-full object-cover"/> : getInitials(payroll.employees?.name || 'Bilinmiyor')}
                            </div>
                            <div>
                                <div className="font-bold text-sm">{payroll.employees?.name}</div>
                                <div className="text-xs text-gray-400">{payroll.employees?.position}</div>
                            </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-purple-600">${annualSalary.toLocaleString()}</td>
                        <td className="p-4 text-sm font-medium text-blue-600">${monthlySalary.toLocaleString()}</td>
                        
                        {/* HESAPLANAN ÖZET DEĞERLER */}
                        <td className="p-4 text-sm font-medium text-green-600">
                            {summary.totalEarnings > 0 ? `+$${summary.totalEarnings.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 text-sm font-medium text-red-500">
                            {summary.totalDeductions > 0 ? `-$${summary.totalDeductions.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4"><span className="font-bold bg-gray-100 px-2 py-1 rounded text-sm">${summary.net.toLocaleString()}</span></td>
                        
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{payroll.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}</span></td>
                        
                        {/* İŞLEM BUTONLARI (GERİ GELDİ) */}
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                {isManager && (
                                    payroll.status === 'Pending' ? (
                                        <button onClick={() => togglePaymentStatus(payroll.id, payroll.status)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors shadow-sm" title="Ödemeyi Onayla">
                                            <CreditCard className="w-4 h-4"/>
                                        </button>
                                    ) : (
                                        <button onClick={() => togglePaymentStatus(payroll.id, payroll.status)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-lg transition-colors" title="Ödemeyi İptal Et">
                                            <XCircle className="w-4 h-4"/>
                                        </button>
                                    )
                                )}
                                <button onClick={() => openDetailModal(payroll)} className={`p-2 rounded-lg border border-transparent ${
                                  isManager 
                                    ? 'text-blue-600 hover:bg-blue-50 hover:border-blue-100' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:border-gray-100'
                                }`}>
                                    {isManager ? <Edit3 className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                                </button>
                            </div>
                        </td>
                     </tr>
                  )})}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- DETAYLI EDİTÖR MODALI --- */}
      {isDetailOpen && selectedPayroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
                
                <div className={`h-4 w-full ${selectedPayroll.status === 'Paid' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                {/* HEADER & CANLI HESAPLAMA */}
                <div className="px-8 py-6 flex justify-between items-start border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white border flex items-center justify-center text-lg font-bold text-gray-500 shadow-sm">
                            {selectedPayroll.employees?.name?.slice(0,2)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{selectedPayroll.employees?.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Briefcase className="w-3 h-3"/> {selectedPayroll.employees?.department}
                                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-700 font-bold">{selectedMonth}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3">
                        <div>
                            <div className="text-xs text-gray-500 font-bold uppercase">NET ÖDENECEK</div>
                            <div className="text-3xl font-black text-gray-900 transition-all duration-300">
                                ${calculateEditorTotals().net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                ({attendanceStats.days} gün × {(attendanceStats.hours / attendanceStats.days || 8).toFixed(0)} saat)
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                              setExportMode('single');
                              setIsExportDialogOpen(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4"/> PDF İndir
                        </button>
                    </div>
                </div>

                        <div className="p-8 space-y-8" onClick={() => setEditingItem(null)}>
                    
                    {/* 0. ÇALIŞMA GÜNLERİ VE SAATLER */}
                    <div className="grid grid-cols-4 gap-4 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                        <div className="text-center">
                            <div className="text-2xl font-black text-cyan-900">
                                {attendanceStats.days || 20}
                            </div>
                            <div className="text-xs text-cyan-700 font-bold mt-1">Çalışma Günü</div>
                        </div>
                        <div className="text-center border-l border-r border-cyan-300">
                            <div className="text-2xl font-black text-blue-900">
                                {attendanceStats.hours || 160}
                            </div>
                            <div className="text-xs text-blue-700 font-bold mt-1">Çalışılan Saat</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-orange-900">
                                {attendanceStats.overtime || 0}
                            </div>
                            <div className="text-xs text-orange-700 font-bold mt-1">Fazla Mesai</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-purple-900">
                                {attendanceStats.leaves?.reduce((sum, leave) => sum + (leave.days || 0), 0) || 0}
                            </div>
                            <div className="text-xs text-purple-700 font-bold mt-1">İzin Günü</div>
                        </div>
                    </div>
                    
                    {/* İZİN DETAYLARI */}
                    {attendanceStats.leaves && attendanceStats.leaves.length > 0 && (
                      <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                        <div className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4"/> İzin Detayları
                        </div>
                        <div className="space-y-2">
                          {attendanceStats.leaves.map((leave, idx) => (
                            <div key={idx} className="bg-white/70 p-3 rounded-lg text-xs border-l-2 border-purple-400">
                              <div className="font-bold text-purple-800">{leave.leave_type || 'İzin'}</div>
                              <div className="text-purple-700 text-xs mt-1">{leave.start_date} - {leave.end_date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 1. YILLIK VE AYLIK MAAŞ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 font-bold text-purple-800 mb-2">
                                <DollarSign className="w-5 h-5"/> Yıllık Maaş
                            </div>
                            <div className="text-2xl font-black text-purple-900">
                              ${parseInt(parseFloat(baseSalary) || 0).toLocaleString()}
                            </div>
                        </div>
                        
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 font-bold text-blue-800 mb-2">
                                <DollarSign className="w-5 h-5"/> Aylık Temel Maaş
                            </div>
                            {isManager ? (
                                <input 
                                    type="number"
                                value={getMonthlyBaseSalary(baseSalary)} 
                                onChange={(e) => setBaseSalary((parseFloat(e.target.value) || 0) * 12)} 
                                    className="w-full text-right font-bold text-2xl bg-white border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <div className="text-2xl font-black text-blue-900">
                                ${getMonthlyBaseSalary(baseSalary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* 2. KAZANÇLAR LİSTESİ */}
                        <div className="space-y-2">
                            <h3 className="text-green-700 font-bold flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5"/> Kazançlar / Eklemeler
                                <span className="text-sm bg-green-100 px-2 py-0.5 rounded text-green-800 ml-auto">
                                    +${calculateEditorTotals().totalEarnings.toLocaleString()}
                                </span>
                            </h3>
                            
                            {earningsList.map((item, index) => {
                                const isEditing = editingItem?.type === 'earnings' && editingItem?.index === index;
                              const calculatedAmount = calculateItemAmount(item, calculateEditorTotals().gross);
                                
                                return (
                                    <div 
                                      key={index}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        isManager && setEditingItem({type: 'earnings', index});
                                      }}
                                      className={`${isManager ? 'cursor-pointer' : ''} transition-all`}
                                    >
                                      {isEditing && isManager ? (
                                        <div className="bg-green-200/70 rounded-xl p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                          <input 
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem('earnings', index, 'name', e.target.value)}
                                            placeholder="Adı"
                                            className="w-full text-xs font-bold bg-white/80 border-0 rounded-lg p-2 outline-none focus:ring-1 focus:ring-green-600"
                                          />
                                          <div className="flex gap-2 items-center">
                                            <input 
                                              type="number"
                                              value={item.value}
                                              onChange={(e) => updateItem('earnings', index, 'value', parseFloat(e.target.value) || 0)}
                                              placeholder="0"
                                              className="flex-1 text-xs font-bold bg-white/80 border-0 rounded-lg p-2 outline-none focus:ring-1 focus:ring-green-600"
                                            />
                                            <button
                                              onClick={() => updateItem('earnings', index, 'type', item.type === 'fixed' ? 'percent' : 'fixed')}
                                              className="px-3 py-2 text-xs bg-white/90 border-0 rounded-lg font-bold text-green-700 hover:bg-white transition-colors"
                                            >
                                              {item.type === 'fixed' ? '$' : '%'}
                                            </button>
                                          </div>
                                          {item.isCustom && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem('earnings', index);
                                                setEditingItem(null);
                                              }}
                                              className="w-full py-1 text-red-600 hover:bg-red-50 rounded font-semibold text-xs"
                                            >
                                              Sil
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-green-50 ${isEditing ? 'bg-green-50' : ''}`}>
                                          <span className="text-sm font-medium text-gray-700 flex-1">{item.name}</span>
                                          <div className="text-right">
                                            <span className="text-sm font-bold text-green-600">
                                              {item.type === 'percent' ? `${item.value}%` : `$${parseFloat(item.value).toLocaleString()}`}
                                            </span>
                                            <span className="text-xs font-bold text-gray-600 ml-1">
                                              {item.type === 'percent' ? '%' : '$'}
                                            </span>
                                            <span className="text-xs text-gray-500 block">
                                              = ${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                );
                            })}
                            
                            {isManager && (
                              <button 
                                onClick={() => {
                                  addItem('earnings');
                                  setEditingItem({type: 'earnings', index: earningsList.length});
                                }}
                                className="w-full py-1.5 text-green-700 font-semibold text-sm hover:bg-green-50 rounded mt-2"
                              >
                                + Kazanç Ekle
                              </button>
                            )}
                        </div>

                        {/* 3. KESİNTİLER LİSTESİ */}
                        <div className="space-y-2">
                            <h3 className="text-red-700 font-bold flex items-center gap-2 mb-3">
                                <TrendingDown className="w-5 h-5"/> Kesintiler / Vergiler
                                <span className="text-sm bg-red-100 px-2 py-0.5 rounded text-red-800 ml-auto">
                                    -${calculateEditorTotals().totalDeductions.toLocaleString()}
                                </span>
                            </h3>

                            {deductionsList.map((item, index) => {
                                const isEditing = editingItem?.type === 'deductions' && editingItem?.index === index;
                              const calculatedAmount = calculateItemAmount(item, calculateEditorTotals().gross);
                                
                                return (
                                    <div 
                                      key={index}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        isManager && setEditingItem({type: 'deductions', index});
                                      }}
                                      className={`${isManager ? 'cursor-pointer' : ''} transition-all`}
                                    >
                                      {isEditing && isManager ? (
                                        <div className="bg-red-200/70 rounded-xl p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                          <input 
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem('deductions', index, 'name', e.target.value)}
                                            placeholder="Adı"
                                            className="w-full text-xs font-bold bg-white/80 border-0 rounded-lg p-2 outline-none focus:ring-1 focus:ring-red-600"
                                          />
                                          <div className="flex gap-2 items-center">
                                            <input 
                                              type="number"
                                              value={item.value}
                                              onChange={(e) => updateItem('deductions', index, 'value', parseFloat(e.target.value) || 0)}
                                              placeholder="0"
                                              className="flex-1 text-xs font-bold bg-white/80 border-0 rounded-lg p-2 outline-none focus:ring-1 focus:ring-red-600"
                                            />
                                            <button
                                              onClick={() => updateItem('deductions', index, 'type', item.type === 'fixed' ? 'percent' : 'fixed')}
                                              className="px-3 py-2 text-xs bg-white/90 border-0 rounded-lg font-bold text-red-700 hover:bg-white transition-colors"
                                            >
                                              {item.type === 'fixed' ? '$' : '%'}
                                            </button>
                                          </div>
                                          {item.isCustom && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem('deductions', index);
                                                setEditingItem(null);
                                              }}
                                              className="w-full py-1 text-red-600 hover:bg-red-50 rounded font-semibold text-xs"
                                            >
                                              Sil
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-red-50 ${isEditing ? 'bg-red-50' : ''}`}>
                                          <span className="text-sm font-medium text-gray-700 flex-1">{item.name}</span>
                                          <div className="text-right">
                                            <span className="text-sm font-bold text-red-600">
                                              {item.type === 'percent' ? `${item.value}%` : `$${parseFloat(item.value).toLocaleString()}`}
                                            </span>
                                            <span className="text-xs font-bold text-gray-600 ml-1">
                                              {item.type === 'percent' ? '%' : '$'}
                                            </span>
                                            <span className="text-xs text-gray-500 block">
                                              = ${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                );
                            })}
                            
                            {isManager && (
                              <button 
                                onClick={() => {
                                  addItem('deductions');
                                  setEditingItem({type: 'deductions', index: deductionsList.length});
                                }}
                                className="w-full py-1.5 text-red-700 font-semibold text-sm hover:bg-red-50 rounded mt-2"
                              >
                                + Kesinti Ekle
                              </button>
                            )}
                        </div>
                    </div>

                    {/* NOT ALANI */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Genel Açıklama</label>
                        <textarea disabled={!isManager} value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded-xl p-3 text-sm h-16 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ekstra notlar..."/>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-white">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm"><Printer className="w-4 h-4"/> Yazdır</button>
                    <div className="flex gap-3">
                        <button onClick={() => { setIsDetailOpen(false); setEditingItem(null); }} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200">Kapat</button>
                        {isManager && (
                            <button onClick={handleSaveChanges} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                                <Save className="w-4 h-4"/> Kaydet
                            </button>
                        )}
                    </div>
                </div>

             </div>
          </div>
      )}

      {/* --- EXPORT FORMAT SECIM DIYALOGU --- */}
      {isExportDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Format Sec</h2>
            <p className="text-gray-600 mb-6">
              {exportMode === 'bulk' 
                ? 'Tum bordrolari hangi formatta indirmek istiyorsunuz?' 
                : 'Bu bordroyu hangi formatta indirmek istiyorsunuz?'}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsExportDialogOpen(false);
                  if (exportMode === 'bulk') {
                    exportPayrollToPDF_Summary(payrolls, selectedMonth);
                  } else {
                    const singlePayroll = { 
                      ...selectedPayroll, 
                      base_salary: baseSalary,
                      earnings_details: earningsList,
                      deductions_details: deductionsList
                    };
                    exportPayrollToPDF_Summary([singlePayroll], selectedMonth);
                  }
                  showSuccess('Ozet PDF indirildi!');
                }}
                className="w-full bg-green-100 border-2 border-green-400 text-green-800 px-6 py-3 rounded-lg font-bold hover:bg-green-200 transition-colors text-left"
              >
                <div className="font-bold">Ozet Format</div>
                <div className="text-sm text-green-700">Tablo halinde kisa bilgi</div>
              </button>
              
              <button
                onClick={() => {
                  setIsExportDialogOpen(false);
                  if (exportMode === 'bulk') {
                    exportPayrollToPDF_Detailed(payrolls, selectedMonth);
                  } else {
                    const singlePayroll = { 
                      ...selectedPayroll, 
                      base_salary: baseSalary,
                      earnings_details: earningsList,
                      deductions_details: deductionsList
                    };
                    exportPayrollToPDF_Detailed([singlePayroll], selectedMonth);
                  }
                  showSuccess('Detayli PDF indirildi!');
                }}
                className="w-full bg-blue-100 border-2 border-blue-400 text-blue-800 px-6 py-3 rounded-lg font-bold hover:bg-blue-200 transition-colors text-left"
              >
                <div className="font-bold">Detayli Format</div>
                <div className="text-sm text-blue-700">Tum kesintiler ve kazanclar</div>
              </button>
              
              <button
                onClick={() => setIsExportDialogOpen(false)}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Iptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};