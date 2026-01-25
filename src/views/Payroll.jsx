import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Calendar, FileText, Plus, Search, Loader2, 
  CreditCard, XCircle, // 👈 Yeni eklenen ikonlar
} from 'lucide-react';

export default function Payroll({ userRole }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');

  // Sadece Yöneticiler ve HR görebilir
  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payrolls')
        .select(`
          *,
          employees ( id, name, avatar, department, position, salary )
        `)
        .eq('period', selectedMonth)
        .order('status', { ascending: false }); // Bekleyenler üste gelsin diye sıralama eklenebilir

      const { data, error } = await query;
      if (error) throw error;

      setPayrolls(data || []);
    } catch (error) {
      console.error("Bordro verisi çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MAAŞ HESAPLAMA ---
  const calculateNetPay = (payroll) => {
    const base = payroll.base_salary || payroll.employees?.salary || 0;
    const bonus = payroll.bonus || 0;
    const deduction = payroll.deductions || 0;
    const tax = payroll.tax || 0;
    return base + bonus - deduction - tax;
  };

  // --- ÖDEME DURUMUNU DEĞİŞTİR (ÖDE / İPTAL ET) ---
  const togglePaymentStatus = async (id, currentStatus) => {
    // Mantık: Eğer 'Pending' ise 'Paid' yap, değilse 'Pending' yap.
    const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    const actionText = newStatus === 'Paid' ? 'ÖDEMEYİ ONAYLIYOR' : 'ÖDEMEYİ İPTAL EDİYOR';

    if (!confirm(`Dikkat: ${actionText}sunuz. Devam edilsin mi?`)) return;

    try {
      const { error } = await supabase
        .from('payrolls')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Local state'i güncelle (Sayfayı yenilemeden renk değişsin)
      setPayrolls(prev => prev.map(p => 
        p.id === id ? { ...p, status: newStatus } : p
      ));

      alert(`İşlem Başarılı! Durum: ${newStatus === 'Paid' ? 'Ödendi ✅' : 'Bekliyor ⏳'}`);

    } catch (error) {
      alert("Hata oluştu: " + error.message);
    }
  };

  // --- OTOMATİK OLUŞTUR ---
  const generatePayrollsForMonth = async () => {
    if (!confirm(`${selectedMonth} dönemi için tüm çalışanlara bordro oluşturulsun mu?`)) return;
    setLoading(true);
    try {
        const { data: employees } = await supabase.from('employees').select('*').eq('status', 'Active');
        if (!employees) throw new Error("Çalışan bulunamadı.");

        const newPayrolls = employees.map(emp => ({
            employee_id: emp.id,
            period: selectedMonth,
            base_salary: emp.salary,
            bonus: 0,
            deductions: 0,
            tax: emp.salary * 0.20,
            net_pay: emp.salary * 0.80,
            status: 'Pending',
            payment_method: 'Bank Transfer'
        }));

        const { error } = await supabase.from('payrolls').upsert(newPayrolls, { onConflict: 'employee_id, period' });
        if (error) throw error;
        alert("Bordrolar başarıyla oluşturuldu! ✅");
        fetchPayrolls();
    } catch (error) {
        alert("Hata: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter(p => 
    p.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <DollarSign className="w-6 h-6 text-green-600"/> Maaş & Bordro Yönetimi
            </h1>
            <p className="text-gray-500 text-sm">Personel maaşlarını görüntüleyin ve yönetin.</p>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-100"
                />
             </div>
             {isManager && (
                 <button onClick={generatePayrollsForMonth} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-200 active:scale-95">
                    <Plus className="w-4 h-4"/> Otomatik Oluştur
                 </button>
             )}
         </div>
      </div>

      {/* ARAMA */}
      <div className="relative">
         <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"/>
         <input type="text" placeholder="Personel ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-colors"/>
      </div>

      {/* TABLO */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Personel</th>
                     <th className="p-4 font-bold">Temel Maaş</th>
                     <th className="p-4 font-bold text-green-600">Bonus (+)</th>
                     <th className="p-4 font-bold text-red-600">Kesinti (-)</th>
                     <th className="p-4 font-bold">Net Ödenecek</th>
                     <th className="p-4 font-bold">Durum</th>
                     <th className="p-4 text-right">İşlem</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="7" className="p-12 text-center text-gray-400"><div className="flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 animate-spin"/> Yükleniyor...</div></td></tr>
                  ) : filteredPayrolls.length === 0 ? (
                     <tr><td colSpan="7" className="p-12 text-center text-gray-400">Kayıt bulunamadı.</td></tr>
                  ) : (
                     filteredPayrolls.map((payroll) => (
                        <tr key={payroll.id} className="hover:bg-gray-50/50 transition-colors group">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                    {payroll.employees?.avatar ? <img src={payroll.employees.avatar} className="w-full h-full object-cover rounded-full"/> : (payroll.employees?.name?.slice(0,2).toUpperCase() || '??')}
                                 </div>
                                 <div>
                                    <div className="font-bold text-gray-800 text-sm">{payroll.employees?.name || 'Bilinmiyor'}</div>
                                    <div className="text-xs text-gray-400">{payroll.employees?.position}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4 text-sm font-medium text-gray-600">${(payroll.base_salary || 0).toLocaleString()}</td>
                           <td className="p-4 text-sm font-medium text-green-600">+${(payroll.bonus || 0).toLocaleString()}</td>
                           <td className="p-4 text-sm font-medium text-red-500">-${((payroll.deductions || 0) + (payroll.tax || 0)).toLocaleString()}</td>
                           <td className="p-4">
                              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">${calculateNetPay(payroll).toLocaleString()}</span>
                           </td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                 {payroll.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                              </span>
                           </td>
                           
                           {/* --- İŞLEM BUTONLARI --- */}
                           <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                  
                                  {/* Yöneticiler için Ödeme / İptal Butonu */}
                                  {isManager && (
                                      payroll.status === 'Pending' ? (
                                          <button 
                                            onClick={() => togglePaymentStatus(payroll.id, payroll.status)}
                                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors shadow-sm"
                                            title="Ödemeyi Onayla"
                                          >
                                              <CreditCard className="w-4 h-4"/>
                                          </button>
                                      ) : (
                                          <button 
                                            onClick={() => togglePaymentStatus(payroll.id, payroll.status)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-lg transition-colors"
                                            title="Ödemeyi İptal Et"
                                          >
                                              <XCircle className="w-4 h-4"/>
                                          </button>
                                      )
                                  )}

                                  <button className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Detay Gör">
                                     <FileText className="w-4 h-4"/>
                                  </button>
                              </div>
                           </td>

                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}