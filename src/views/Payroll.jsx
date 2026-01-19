import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { DollarSign, Download, Filter, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function Payroll({ currentUserId, userRole }) {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Varsayılan olarak bugünün ayı (YYYY-MM formatı)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  useEffect(() => {
    fetchPayrolls();
  }, [currentUserId, userRole, selectedMonth]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payrolls')
        .select(`
            *,
            employees:employee_id (name, department, avatar, position)
        `)
        .eq('period', selectedMonth)
        .order('created_at', { ascending: false });

      // 🔒 GÜVENLİK: Çalışan sadece kendini görsün
      if (userRole === 'employee') {
         query = query.eq('employee_id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) {
      console.error("Bordro hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔒 SADECE YÖNETİCİLER ÇALIŞTIRABİLİR
  const handleRunPayroll = async () => {
    if (userRole === 'employee') return alert("Bu işlem için yetkiniz yok.");
    
    if (!window.confirm(`${selectedMonth} dönemi için maaşları hesaplamak istiyor musunuz?`)) return;
    
    setCalculating(true);
    try {
      // 1. Aktif çalışanları çek
      const { data: activeEmployees, error: empError } = await supabase
        .from('employees')
        .select('id, salary')
        .eq('status', 'Active');

      if (empError) throw empError;
      if (!activeEmployees || activeEmployees.length === 0) throw new Error("Aktif çalışan bulunamadı.");

      // 2. Bu ay zaten maaşı hesaplananları bul
      const { data: existingPayrolls, error: existingError } = await supabase
        .from('payrolls')
        .select('employee_id')
        .eq('period', selectedMonth);

      if (existingError) throw existingError;
      const existingEmployeeIds = existingPayrolls.map(p => p.employee_id);

      // 3. Sadece hesaplanmamış olanları filtrele
      const employeesToPay = activeEmployees.filter(emp => !existingEmployeeIds.includes(emp.id));

      if (employeesToPay.length === 0) {
        alert("Bu dönem için tüm aktif personelin maaşı zaten oluşturulmuş! ✅");
        setCalculating(false);
        return;
      }

      // 4. Hesapla ve Ekle
      const payrollRecords = employeesToPay.map(emp => {
        const base = emp.salary / 12; // Aylık Brüt
        const tax = base * 0.15; // Vergi (Örnek %15)
        const net = base - tax;

        return {
          employee_id: emp.id,
          period: selectedMonth,
          base_salary: Math.floor(base),
          deductions: Math.floor(tax),
          bonus: 0,
          net_pay: Math.floor(net),
          status: 'Pending', 
          payment_date: null
        };
      });

      const { error } = await supabase.from('payrolls').insert(payrollRecords);
      if (error) throw error;
      
      alert(`${payrollRecords.length} yeni maaş kaydı oluşturuldu!`);
      fetchPayrolls();

    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
       {/* BAŞLIK VE KONTROLLER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bordro & Maaşlar</h1>
            <p className="text-gray-500">Maaş ödemelerini ve bordro geçmişini yönetin.</p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Dönem Seçici */}
             <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500"/>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                    className="bg-transparent outline-none text-sm font-bold text-gray-700"
                />
             </div>

             {/* Hesapla Butonu (Sadece Yetkili) */}
             {userRole !== 'employee' && (
                <button 
                    onClick={handleRunPayroll} 
                    disabled={calculating} 
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-green-700 flex items-center gap-2 transition-all"
                >
                    {calculating ? <Loader2 className="w-4 h-4 animate-spin"/> : <DollarSign className="w-4 h-4"/>} 
                    {calculating ? 'Hesaplanıyor...' : 'Maaşları Hesapla'}
                </button>
             )}
          </div>
       </div>

       {/* TABLO */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                <tr>
                   <th className="px-6 py-4 font-bold">Personel</th>
                   <th className="px-6 py-4 font-bold">Dönem</th>
                   <th className="px-6 py-4 font-bold">Brüt Maaş</th>
                   <th className="px-6 py-4 font-bold text-red-500">Kesintiler</th>
                   <th className="px-6 py-4 font-bold text-green-600">Net Ödenen</th>
                   <th className="px-6 py-4 font-bold">Durum</th>
                   <th className="px-6 py-4 font-bold text-right">Bordro</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {payrolls.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-gray-300"/>
                        Bu dönem için kayıt bulunamadı.
                    </td></tr>
                ) : (
                   payrolls.map(pay => (
                      <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                         {/* Personel */}
                         <td className="px-6 py-4">
                            <div>
                                <p className="font-bold text-gray-800">{pay.employees?.name}</p>
                                <p className="text-xs text-gray-500">{pay.employees?.position}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4 font-medium text-gray-600">{pay.period}</td>
                         <td className="px-6 py-4 font-medium text-gray-600 tabular-nums">${pay.base_salary.toLocaleString()}</td>
                         <td className="px-6 py-4 font-bold text-red-500 tabular-nums">-${pay.deductions.toLocaleString()}</td>
                         <td className="px-6 py-4 font-bold text-green-700 text-base tabular-nums bg-green-50/30">${pay.net_pay.toLocaleString()}</td>
                         
                         {/* Durum */}
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                pay.status === 'Paid' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                            }`}>
                               {pay.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                            </span>
                         </td>
                         
                         {/* İndir Butonu */}
                         <td className="px-6 py-4 text-right">
                            <button className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Bordro İndir">
                                <Download className="w-4 h-4"/>
                            </button>
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}