import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Calendar, FileText, Plus, Search, Loader2, 
  CreditCard, XCircle, X, Printer, User, Clock, 
  TrendingUp, TrendingDown, Briefcase, Building
} from 'lucide-react';

export default function Payroll({ userRole }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [searchTerm, setSearchTerm] = useState('');

  // DETAY MODALI İÇİN STATE
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
          employees ( id, name, avatar, department, position, salary, start_date )
        `)
        .eq('period', selectedMonth)
        .order('status', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) {
      console.error("Veri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HESAPLAMA FONKSİYONLARI ---
  const calculateNetPay = (p) => {
    const base = p.base_salary || p.employees?.salary || 0;
    const bonus = p.bonus || 0;
    const deduction = p.deductions || 0;
    const tax = p.tax || 0;
    return base + bonus - deduction - tax;
  };

  const calculateTotalEarnings = (p) => (p.base_salary || 0) + (p.bonus || 0);
  const calculateTotalDeductions = (p) => (p.deductions || 0) + (p.tax || 0);

  // --- ÖDEME DURUMU DEĞİŞTİR ---
  const togglePaymentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    if (!confirm(newStatus === 'Paid' ? 'Ödeme onaylansın mı?' : 'Ödeme iptal edilsin mi?')) return;

    try {
      const { error } = await supabase.from('payrolls').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      // Modalı da güncelle (eğer açıksa)
      if (selectedPayroll && selectedPayroll.id === id) {
          setSelectedPayroll(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) { alert("Hata: " + error.message); }
  };

  // --- OTOMATİK OLUŞTUR ---
  const generatePayrollsForMonth = async () => {
    if (!confirm("Otomatik bordro oluşturulsun mu?")) return;
    setLoading(true);
    try {
        const { data: employees } = await supabase.from('employees').select('*').eq('status', 'Active');
        const newPayrolls = employees.map(emp => ({
            employee_id: emp.id, period: selectedMonth, base_salary: emp.salary, 
            bonus: 0, deductions: 0, tax: emp.salary * 0.20, status: 'Pending'
        }));
        await supabase.from('payrolls').upsert(newPayrolls, { onConflict: 'employee_id, period' });
        fetchPayrolls();
    } catch (error) { alert("Hata: " + error.message); } finally { setLoading(false); }
  };

  const filteredPayrolls = payrolls.filter(p => p.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- MODAL AÇMA ---
  const openDetailModal = (payroll) => {
      setSelectedPayroll(payroll);
      setIsDetailOpen(true);
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

      {/* ARAMA */}
      <div className="relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"/><input type="text" placeholder="Personel ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl"/></div>

      {/* TABLO */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Personel</th>
                     <th className="p-4 font-bold">Temel Maaş</th>
                     <th className="p-4 font-bold text-green-600">Bonus</th>
                     <th className="p-4 font-bold text-red-600">Kesinti</th>
                     <th className="p-4 font-bold">Net</th>
                     <th className="p-4 font-bold">Durum</th>
                     <th className="p-4 text-right">İşlem</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="7" className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr> : 
                  filteredPayrolls.map((payroll) => (
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
                        <td className="p-4 text-sm font-medium text-green-600">+${(payroll.bonus||0).toLocaleString()}</td>
                        <td className="p-4 text-sm font-medium text-red-500">-${((payroll.deductions||0) + (payroll.tax||0)).toLocaleString()}</td>
                        <td className="p-4"><span className="font-bold bg-gray-100 px-2 py-1 rounded text-sm">${calculateNetPay(payroll).toLocaleString()}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{payroll.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}</span></td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                {isManager && <button onClick={() => togglePaymentStatus(payroll.id, payroll.status)} className={`p-2 rounded-lg text-white ${payroll.status === 'Pending' ? 'bg-green-600' : 'bg-red-500'}`}>{payroll.status === 'Pending' ? <CreditCard className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}</button>}
                                <button onClick={() => openDetailModal(payroll)} className="text-gray-400 hover:text-blue-600 p-2 bg-gray-50 hover:bg-blue-50 rounded-lg"><FileText className="w-4 h-4"/></button>
                            </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- DETAYLI MAAŞ BORDROSU MODALI --- */}
      {isDetailOpen && selectedPayroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
                
                {/* ÜST RENKLİ ŞERİT */}
                <div className={`h-4 w-full ${selectedPayroll.status === 'Paid' ? 'bg-green-500' : 'bg-orange-400'}`}></div>

                {/* HEADER */}
                <div className="px-8 py-6 flex justify-between items-start border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                            {selectedPayroll.employees?.avatar ? <img src={selectedPayroll.employees.avatar} className="w-full h-full object-cover rounded-2xl"/> : selectedPayroll.employees?.name?.slice(0,2)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedPayroll.employees?.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Briefcase className="w-3 h-3"/> {selectedPayroll.employees?.position}
                                <span className="text-gray-300">•</span>
                                <Building className="w-3 h-3"/> {selectedPayroll.employees?.department}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                                <Calendar className="w-3 h-3"/> {selectedMonth} Dönemi
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Net Ödenecek</div>
                        <div className="text-3xl font-black text-gray-900">${calculateNetPay(selectedPayroll).toLocaleString()}</div>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${selectedPayroll.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {selectedPayroll.status === 'Paid' ? 'ÖDENDİ ✅' : 'ÖDEME BEKLİYOR ⏳'}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-gray-50/50">
                    
                    {/* 1. BÖLÜM: ZAMAN VE DEVAMLILIK (MOCK DATA KULLANILIYOR) */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600"/> Zaman Çizelgesi & İzinler
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 font-bold uppercase">Çalışma Günü</div>
                                <div className="text-xl font-bold text-gray-800 mt-1">22 Gün</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 font-bold uppercase">Toplam Saat</div>
                                <div className="text-xl font-bold text-gray-800 mt-1">176s</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 font-bold uppercase">Mesai</div>
                                <div className="text-xl font-bold text-blue-600 mt-1">0s</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 font-bold uppercase">Kullanılan İzin</div>
                                <div className="text-xl font-bold text-orange-500 mt-1">0 Gün</div>
                            </div>
                        </div>
                    </div>

                    {/* 2. BÖLÜM: GELİR VE GİDER DETAYLARI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* KAZANÇLAR */}
                        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
                            <h3 className="text-green-700 font-bold flex items-center gap-2 mb-4 border-b border-green-50 pb-2">
                                <TrendingUp className="w-5 h-5"/> Kazançlar (Income)
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Temel Maaş</span>
                                    <span className="font-bold text-gray-900">${(selectedPayroll.base_salary || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Mesai Ücreti</span>
                                    <span className="font-bold text-gray-900">$0.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Performans Bonusu</span>
                                    <span className="font-bold text-green-600">+${(selectedPayroll.bonus || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Yol / Yemek Yardımı</span>
                                    <span className="font-bold text-gray-900">$0.00</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Toplam Brüt</span>
                                    <span className="text-lg font-bold text-green-700">${calculateTotalEarnings(selectedPayroll).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* KESİNTİLER */}
                        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
                            <h3 className="text-red-700 font-bold flex items-center gap-2 mb-4 border-b border-red-50 pb-2">
                                <TrendingDown className="w-5 h-5"/> Kesintiler (Deductions)
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Gelir Vergisi</span>
                                    <span className="font-bold text-red-600">-${(selectedPayroll.tax || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">SGK Primi</span>
                                    <span className="font-bold text-red-600">$0.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Özel Kesintiler / Avans</span>
                                    <span className="font-bold text-red-600">-${(selectedPayroll.deductions || 0).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Toplam Kesinti</span>
                                    <span className="text-lg font-bold text-red-600">-${calculateTotalDeductions(selectedPayroll).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* NOT ALANI */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
                        <div className="mt-1"><FileText className="w-4 h-4"/></div>
                        <div>
                            <span className="font-bold">Not:</span> Bu bordro sistemsel olarak oluşturulmuştur. Ödeme tutarında bir hata olduğunu düşünüyorsanız lütfen İK departmanı ile iletişime geçiniz.
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-white">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm">
                        <Printer className="w-4 h-4"/> Yazdır / PDF
                    </button>
                    <button onClick={() => setIsDetailOpen(false)} className="bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200">
                        Kapat
                    </button>
                </div>

             </div>
          </div>
      )}

    </div>
  );
}