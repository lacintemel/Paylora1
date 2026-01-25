import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Calendar, FileText, Plus, Search, Loader2, 
  CreditCard, XCircle, X, Printer, Clock, Save, Edit3,
  TrendingUp, TrendingDown, Briefcase, Building, AlertCircle
} from 'lucide-react';

export default function Payroll({ userRole }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [searchTerm, setSearchTerm] = useState('');

  // DETAY MODALI STATE
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ days: 0, hours: 0, overtime: 0, loading: false });

  // ⚡ DÜZENLEME STATE (Yöneticiler için)
  const [editFormData, setEditFormData] = useState({
      base_salary: 0, bonus: 0, deductions: 0, tax: 0, notes: ''
  });

  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payrolls')
        .select(`*, employees ( id, name, avatar, department, position, salary )`)
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

  const fetchEmployeeAttendance = async (employeeId) => {
      setAttendanceStats({ days: 0, hours: 0, overtime: 0, loading: true });
      try {
          const { data: logs } = await supabase.from('time_logs')
            .select('duration_minutes, date')
            .eq('employee_id', employeeId)
            .ilike('date', `${selectedMonth}%`);

          const totalMinutes = logs?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0;
          const totalHours = Math.floor(totalMinutes / 60);
          setAttendanceStats({ days: logs?.length || 0, hours: totalHours, overtime: Math.max(0, totalHours - 160), loading: false });
      } catch (error) { console.error(error); }
  };

  // --- CANLI HESAPLAMA (Editör Modu İçin) ---
  const calculateLiveNetPay = () => {
      // Formdaki verileri kullanır (Anlık değişim için)
      const base = parseFloat(editFormData.base_salary) || 0;
      const bonus = parseFloat(editFormData.bonus) || 0;
      const deduction = parseFloat(editFormData.deductions) || 0;
      const tax = parseFloat(editFormData.tax) || 0;
      return base + bonus - deduction - tax;
  };

  // --- VERİTABANI İŞLEMLERİ ---
  const handleSaveChanges = async () => {
      if (!isManager) return;
      if (!confirm("Bordro güncellemeleri kaydedilsin mi?")) return;

      try {
          const { error } = await supabase.from('payrolls').update({
              base_salary: editFormData.base_salary,
              bonus: editFormData.bonus,
              deductions: editFormData.deductions,
              tax: editFormData.tax,
              notes: editFormData.notes
          }).eq('id', selectedPayroll.id);

          if (error) throw error;

          alert("Bordro Güncellendi! ✅");
          setIsDetailOpen(false);
          fetchPayrolls(); // Listeyi yenile
      } catch (error) {
          alert("Hata: " + error.message);
      }
  };

  const togglePaymentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    if (!confirm(newStatus === 'Paid' ? 'Ödeme onaylansın mı?' : 'Ödeme iptal edilsin mi?')) return;
    try {
      const { error } = await supabase.from('payrolls').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (selectedPayroll && selectedPayroll.id === id) setSelectedPayroll(prev => ({ ...prev, status: newStatus }));
    } catch (error) { alert("Hata: " + error.message); }
  };

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

  // --- MODAL AÇMA ---
  const openDetailModal = (payroll) => {
      setSelectedPayroll(payroll);
      // Form verilerini doldur
      setEditFormData({
          base_salary: payroll.base_salary || 0,
          bonus: payroll.bonus || 0,
          deductions: payroll.deductions || 0,
          tax: payroll.tax || 0,
          notes: payroll.notes || ''
      });
      setIsDetailOpen(true);
      if (payroll.employee_id) fetchEmployeeAttendance(payroll.employee_id);
  };

  const filteredPayrolls = payrolls.filter(p => p.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

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

      {/* TABLO */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Personel</th>
                     <th className="p-4 font-bold">Temel</th>
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
                        <td className="p-4"><span className="font-bold bg-gray-100 px-2 py-1 rounded text-sm">${(calculateLiveNetPay.call({editFormData: payroll}) || (payroll.base_salary + payroll.bonus - payroll.deductions - payroll.tax)).toLocaleString()}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${payroll.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{payroll.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}</span></td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                {isManager && <button onClick={() => togglePaymentStatus(payroll.id, payroll.status)} className={`p-2 rounded-lg text-white ${payroll.status === 'Pending' ? 'bg-green-600' : 'bg-red-500'}`}>{payroll.status === 'Pending' ? <CreditCard className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}</button>}
                                <button onClick={() => openDetailModal(payroll)} className="text-gray-400 hover:text-blue-600 p-2 bg-gray-50 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4"/></button>
                            </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- DETAYLI VE DÜZENLENEBİLİR MAAŞ BORDROSU MODALI --- */}
      {isDetailOpen && selectedPayroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
                
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
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Net Ödenecek</div>
                        {/* ⚡ CANLI HESAPLANAN DEĞER */}
                        <div className="text-3xl font-black text-gray-900 animate-in fade-in">
                            ${calculateLiveNetPay().toLocaleString()}
                        </div>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${selectedPayroll.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {selectedPayroll.status === 'Paid' ? 'ÖDENDİ ✅' : 'DÜZENLENİYOR ✏️'}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-gray-50/50">
                    
                    {/* ZAMAN BİLGİLERİ (READ ONLY) */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600"/> Zaman Çizelgesi (Otomatik)</h3>
                        {attendanceStats.loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400"/> : (
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"><div className="text-xs text-gray-400 font-bold uppercase">Gün</div><div className="text-lg font-bold text-gray-800">{attendanceStats.days}</div></div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"><div className="text-xs text-gray-400 font-bold uppercase">Saat</div><div className="text-lg font-bold text-gray-800">{attendanceStats.hours}s</div></div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"><div className="text-xs text-gray-400 font-bold uppercase">Mesai</div><div className="text-lg font-bold text-blue-600">{attendanceStats.overtime}s</div></div>
                        </div>
                        )}
                    </div>

                    {/* DÜZENLENEBİLİR ALANLAR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* KAZANÇLAR (EDİT) */}
                        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
                            <h3 className="text-green-700 font-bold flex items-center gap-2 mb-4 border-b border-green-50 pb-2"><TrendingUp className="w-5 h-5"/> Kazançlar</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Temel Maaş</label>
                                    <input type="number" disabled={!isManager} value={editFormData.base_salary} onChange={e=>setEditFormData({...editFormData, base_salary: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 font-bold text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Bonus / Ek Ödeme / Mesai</label>
                                    <input type="number" disabled={!isManager} value={editFormData.bonus} onChange={e=>setEditFormData({...editFormData, bonus: e.target.value})} className="w-full border border-green-200 bg-green-50 rounded-lg p-2 font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none"/>
                                </div>
                            </div>
                        </div>

                        {/* KESİNTİLER (EDİT) */}
                        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
                            <h3 className="text-red-700 font-bold flex items-center gap-2 mb-4 border-b border-red-50 pb-2"><TrendingDown className="w-5 h-5"/> Kesintiler</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Vergi (Manuel Düzenlenebilir)</label>
                                    <input type="number" disabled={!isManager} value={editFormData.tax} onChange={e=>setEditFormData({...editFormData, tax: e.target.value})} className="w-full border border-red-200 bg-red-50 rounded-lg p-2 font-bold text-red-700 focus:ring-2 focus:ring-red-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Avans / Ceza / Diğer Kesintiler</label>
                                    <input type="number" disabled={!isManager} value={editFormData.deductions} onChange={e=>setEditFormData({...editFormData, deductions: e.target.value})} className="w-full border border-red-200 bg-red-50 rounded-lg p-2 font-bold text-red-700 focus:ring-2 focus:ring-red-500 outline-none"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* NOT ALANI */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Bordro Notları (Avans detayı, yasa değişikliği vb.)</label>
                        <textarea disabled={!isManager} value={editFormData.notes} onChange={e=>setEditFormData({...editFormData, notes: e.target.value})} className="w-full border rounded-xl p-3 text-sm h-20 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Örn: 2000 TL avans kesildi. Resmi Gazete zammı eklendi."/>
                    </div>

                </div>

                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-white">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm"><Printer className="w-4 h-4"/> Yazdır</button>
                    <div className="flex gap-3">
                        <button onClick={() => setIsDetailOpen(false)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200">Kapat</button>
                        {isManager && (
                            <button onClick={handleSaveChanges} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                                <Save className="w-4 h-4"/> Değişiklikleri Kaydet
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