import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    DollarSign, Calendar, FileText, Plus, Search, Loader2, 
    CreditCard, XCircle, Printer, Clock, Save, Edit3,
    TrendingUp, TrendingDown, Briefcase, Building, PlusCircle, Trash2,
    ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper';
import { exportPayrollToPDF } from '../utils/exportUtils';
import { showSuccess, showError } from '../utils/toast';

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

  // 2. Tablo Satırı İçin Özet Hesapla (JSON verisinden)
  const calculateRowSummary = (payroll) => {
      const base = payroll.base_salary || 0;
      // JSON listelerini topla
      const totalEarnings = (payroll.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, base), 0);
      const totalDeductions = (payroll.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, base), 0);
      
      return {
          totalEarnings,
          totalDeductions,
          net: base + totalEarnings - totalDeductions
      };
  };

  // 3. Editör Modalı İçin Canlı Hesapla (State verisinden)
  const calculateEditorTotals = () => {
      const gross = parseFloat(baseSalary) || 0;
      const totalEarnings = earningsList.reduce((acc, item) => acc + calculateItemAmount(item, gross), 0);
      const totalDeductions = deductionsList.reduce((acc, item) => acc + calculateItemAmount(item, gross), 0);
      
      return {
          gross,
          totalEarnings,
          totalDeductions,
          net: gross + totalEarnings - totalDeductions
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

  // Otomatik Oluşturucu
  const generatePayrollsForMonth = async () => {
    if (!confirm("Otomatik bordro oluşturulsun mu?")) return;
    setLoading(true);
    try {
        const { data: employees } = await supabase.from('employees').select('*').eq('status', 'Active');
        console.log('Çalışanlar:', employees);
        
        for (const emp of employees) {
            // Önce bak, varsa güncelle, yoksa ekle
            const { data: existing } = await supabase
                .from('payrolls')
                .select('id')
                .eq('employee_id', emp.id)
                .eq('period', selectedMonth)
                .single();
            
            const payrollData = {
                employee_id: emp.id,
                period: selectedMonth,
                base_salary: emp.salary,
                status: 'Pending',
                earnings_details: DEFAULT_EARNINGS,
                deductions_details: DEFAULT_DEDUCTIONS,
                net_pay: emp.salary * 0.70
            };
            
            console.log(`${emp.name} için bordro:`, payrollData);
            
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
        showSuccess('Bordro başarıyla oluşturuldu!');
    } catch (error) { 
        console.error('Full error:', error);
        showError("Hata: " + error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- MODAL AÇMA VE VERİ HAZIRLAMA ---
  const openDetailModal = (payroll) => {
      console.log('Opening payroll:', payroll);
      console.log('Base salary:', payroll.base_salary);
      console.log('Earnings:', payroll.earnings_details);
      console.log('Deductions:', payroll.deductions_details);
      
      setSelectedPayroll(payroll);
      setBaseSalary(payroll.base_salary || payroll.employees?.salary || 0);
      setEarningsList(payroll.earnings_details && payroll.earnings_details.length > 0 ? payroll.earnings_details : DEFAULT_EARNINGS);
      setDeductionsList(payroll.deductions_details && payroll.deductions_details.length > 0 ? payroll.deductions_details : DEFAULT_DEDUCTIONS);
      setNote(payroll.notes || '');
      setEditingItem(null);
      setIsDetailOpen(true);
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
                 <button onClick={() => { exportPayrollToPDF(filteredPayrolls, selectedMonth); showSuccess('Bordro raporu PDF olarak indirildi!'); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Download className="w-4 h-4"/> İndir</button>
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
                     const annualSalary = parseInt((payroll.base_salary || 0) * 12); // Tam sayı - kuruş at

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
                        <td className="p-4 text-sm font-medium text-blue-600">${(payroll.base_salary||0).toLocaleString()}</td>
                        
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
                    <div className="text-right">
                        <div className="text-xs text-gray-500 font-bold uppercase">NET ÖDENECEK</div>
                        <div className="text-3xl font-black text-gray-900 transition-all duration-300">
                            ${calculateEditorTotals().net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                        <div className="p-8 space-y-8" onClick={() => setEditingItem(null)}>
                    
                    {/* 1. YILLIK VE AYLIK MAAŞ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 font-bold text-purple-800 mb-2">
                                <DollarSign className="w-5 h-5"/> Yıllık Maaş
                            </div>
                            <div className="text-2xl font-black text-purple-900">
                                ${parseInt(parseFloat(baseSalary) * 12).toLocaleString()}
                            </div>
                        </div>
                        
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 font-bold text-blue-800 mb-2">
                                <DollarSign className="w-5 h-5"/> Aylık Temel Maaş
                            </div>
                            {isManager ? (
                                <input 
                                    type="number"
                                    value={baseSalary} 
                                    onChange={(e) => setBaseSalary(e.target.value)} 
                                    className="w-full text-right font-bold text-2xl bg-white border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <div className="text-2xl font-black text-blue-900">
                                    ${parseFloat(baseSalary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                const calculatedAmount = calculateItemAmount(item, baseSalary);
                                
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
                                const calculatedAmount = calculateItemAmount(item, baseSalary);
                                
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

    </div>
  );
}