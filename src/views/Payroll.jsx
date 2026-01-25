import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Calendar, FileText, Plus, Search, Loader2, 
  CreditCard, XCircle, Printer, Clock, Save, Edit3,
  TrendingUp, TrendingDown, Briefcase, Building, Percent, Hash, PlusCircle, Trash2
} from 'lucide-react';

export default function Payroll({ userRole }) {
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
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 }, // %14 Standart
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 }, // %1
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 }, // %15 Başlangıç
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 }, // Binde 7.59
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
  ];

  useEffect(() => { fetchPayrolls(); }, [selectedMonth]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payrolls')
        .select(`*, employees ( id, name, avatar, department, position, salary )`)
        .eq('period', selectedMonth)
        .order('status', { ascending: false });
      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) { console.error("Veri hatası:", error); } finally { setLoading(false); }
  };

  // --- MANTIK VE HESAPLAMALAR ---
  
  // Bir kalemin TL karşılığını hesapla (Yüzde ise Maaştan, değilse direkt)
  const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      if (item.type === 'percent') {
          return (salary * val) / 100;
      }
      return val;
  };

  // Toplamları Hesapla (Canlı)
  const calculateTotals = () => {
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
  
  const handleSaveChanges = async () => {
      if (!isManager) return;
      if (!confirm("Bordro güncellemeleri kaydedilsin mi?")) return;

      try {
          const totals = calculateTotals();

          const { error } = await supabase.from('payrolls').update({
              base_salary: baseSalary,
              earnings_details: earningsList,     // JSON olarak kaydet
              deductions_details: deductionsList, // JSON olarak kaydet
              net_pay: totals.net, // Hızlı sorgu için net tutarı da ayrıca güncelleyelim
              notes: note
          }).eq('id', selectedPayroll.id);

          if (error) throw error;
          alert("Bordro Güncellendi! ✅");
          setIsDetailOpen(false);
          fetchPayrolls();
      } catch (error) { alert("Hata: " + error.message); }
  };

  // Otomatik Oluşturucu
  const generatePayrollsForMonth = async () => {
    if (!confirm("Otomatik bordro oluşturulsun mu?")) return;
    setLoading(true);
    try {
        const { data: employees } = await supabase.from('employees').select('*').eq('status', 'Active');
        
        const newPayrolls = employees.map(emp => ({
            employee_id: emp.id, period: selectedMonth, base_salary: emp.salary, 
            status: 'Pending',
            earnings_details: DEFAULT_EARNINGS, // Varsayılan boş şablon
            deductions_details: DEFAULT_DEDUCTIONS, // Varsayılan vergi şablonu
            net_pay: emp.salary * 0.70 // Kabaca net (Detaylar sonra hesaplanır)
        }));
        await supabase.from('payrolls').upsert(newPayrolls, { onConflict: 'employee_id, period' });
        fetchPayrolls();
    } catch (error) { alert("Hata: " + error.message); } finally { setLoading(false); }
  };

  // --- MODAL AÇMA VE VERİ HAZIRLAMA ---
  const openDetailModal = (payroll) => {
      setSelectedPayroll(payroll);
      setBaseSalary(payroll.base_salary || payroll.employees?.salary || 0);
      
      // Eğer veritabanında detay yoksa varsayılanları yükle, varsa olanı getir
      setEarningsList(payroll.earnings_details && payroll.earnings_details.length > 0 ? payroll.earnings_details : DEFAULT_EARNINGS);
      setDeductionsList(payroll.deductions_details && payroll.deductions_details.length > 0 ? payroll.deductions_details : DEFAULT_DEDUCTIONS);
      
      setNote(payroll.notes || '');
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
         <div className="flex gap-3">
             <div className="relative"><Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="pl-9 pr-4 py-2 border rounded-xl text-sm font-bold"/></div>
             {isManager && <button onClick={generatePayrollsForMonth} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus className="w-4 h-4"/> Oluştur</button>}
         </div>
      </div>

      <div className="relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"/><input type="text" placeholder="Personel ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl"/></div>

      {/* ANA TABLO */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Personel</th>
                     <th className="p-4 font-bold">Temel Maaş</th>
                     <th className="p-4 font-bold">Net Ödenecek</th>
                     <th className="p-4 font-bold">Durum</th>
                     <th className="p-4 text-right">Detay</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="5" className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr> : 
                  payrolls.filter(p => p.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((payroll) => {
                     // Tablo görünümü için basit hesaplama (veya DB'den gelen net_pay)
                     const netDisp = payroll.net_pay || 0;
                     return (
                     <tr key={payroll.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                {payroll.employees?.avatar ? <img src={payroll.employees.avatar} className="w-full h-full rounded-full object-cover"/> : payroll.employees?.name?.slice(0,2)}
                            </div>
                            <div>
                                <div className="font-bold text-sm">{payroll.employees?.name}</div>
                                <div className="text-xs text-gray-400">{payroll.employees?.position}</div>
                            </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-600">${(payroll.base_salary||0).toLocaleString()}</td>
                        <td className="p-4"><span className="font-bold bg-gray-100 px-2 py-1 rounded text-sm">${netDisp.toLocaleString()}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{payroll.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}</span></td>
                        <td className="p-4 text-right">
                            <button onClick={() => openDetailModal(payroll)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit3 className="w-4 h-4"/></button>
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
                            ${calculateTotals().net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    
                    {/* 1. TEMEL MAAŞ */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-blue-800">
                            <DollarSign className="w-5 h-5"/> Temel Brüt Maaş
                        </div>
                        <input 
                            type="number" disabled={!isManager} 
                            value={baseSalary} 
                            onChange={(e) => setBaseSalary(e.target.value)} 
                            className="w-40 text-right font-bold text-lg bg-white border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* 2. KAZANÇLAR LİSTESİ */}
                        <div className="space-y-4">
                            <h3 className="text-green-700 font-bold flex items-center justify-between border-b border-green-100 pb-2">
                                <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Kazançlar / Eklemeler</span>
                                <span className="text-sm bg-green-100 px-2 py-1 rounded text-green-800">
                                    +${calculateTotals().totalEarnings.toLocaleString()}
                                </span>
                            </h3>
                            
                            <div className="space-y-2">
                                {earningsList.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                                        {/* İsim Alanı */}
                                        {item.isCustom ? (
                                            <input type="text" placeholder="Kalem Adı..." value={item.name} onChange={(e) => updateItem('earnings', index, 'name', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium"/>
                                        ) : (
                                            <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                                        )}

                                        {/* Değer */}
                                        <input type="number" disabled={!isManager} value={item.value} onChange={(e) => updateItem('earnings', index, 'value', e.target.value)} className="w-20 bg-white border border-gray-200 rounded px-2 py-1 text-sm text-right font-bold text-green-600 focus:outline-none focus:border-green-500"/>

                                        {/* Tip Seçici (% veya ₺) */}
                                        <button disabled={!isManager} onClick={() => updateItem('earnings', index, 'type', item.type === 'fixed' ? 'percent' : 'fixed')} className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs ${item.type === 'percent' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {item.type === 'percent' ? '%' : '₺'}
                                        </button>

                                        {/* Sil Butonu (Sadece Özel Eklenenler İçin) */}
                                        {isManager && item.isCustom && (
                                            <button onClick={() => removeItem('earnings', index)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                ))}
                                {isManager && (
                                    <button onClick={() => addItem('earnings')} className="w-full py-2 border border-dashed border-green-300 text-green-600 rounded-lg text-sm font-bold hover:bg-green-50 flex items-center justify-center gap-2">
                                        <PlusCircle className="w-4 h-4"/> Diğer Ekle
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. KESİNTİLER LİSTESİ */}
                        <div className="space-y-4">
                            <h3 className="text-red-700 font-bold flex items-center justify-between border-b border-red-100 pb-2">
                                <span className="flex items-center gap-2"><TrendingDown className="w-5 h-5"/> Kesintiler / Vergiler</span>
                                <span className="text-sm bg-red-100 px-2 py-1 rounded text-red-800">
                                    -${calculateTotals().totalDeductions.toLocaleString()}
                                </span>
                            </h3>

                            <div className="space-y-2">
                                {deductionsList.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        {item.isCustom ? (
                                            <input type="text" placeholder="Kalem Adı..." value={item.name} onChange={(e) => updateItem('deductions', index, 'name', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm font-medium"/>
                                        ) : (
                                            <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                                        )}

                                        <input type="number" disabled={!isManager} value={item.value} onChange={(e) => updateItem('deductions', index, 'value', e.target.value)} className="w-20 bg-white border border-gray-200 rounded px-2 py-1 text-sm text-right font-bold text-red-600 focus:outline-none focus:border-red-500"/>

                                        <button disabled={!isManager} onClick={() => updateItem('deductions', index, 'type', item.type === 'fixed' ? 'percent' : 'fixed')} className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs ${item.type === 'percent' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {item.type === 'percent' ? '%' : '₺'}
                                        </button>

                                        {isManager && item.isCustom && (
                                            <button onClick={() => removeItem('deductions', index)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                ))}
                                {isManager && (
                                    <button onClick={() => addItem('deductions')} className="w-full py-2 border border-dashed border-red-300 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                                        <PlusCircle className="w-4 h-4"/> Diğer Ekle
                                    </button>
                                )}
                            </div>
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
                        <button onClick={() => setIsDetailOpen(false)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200">Kapat</button>
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