import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  DollarSign, Download, Search, Filter, Play, CheckCircle, Clock, FileText, Loader2, AlertCircle
} from 'lucide-react';

export default function Payroll({ currentUserId, userRole }) {
  // --- STATE ---
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState('All');

  // YÖNETİCİ KONTROLÜ
  const isManager = ['hr', 'general_manager'].includes(userRole);

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    if (currentUserId) fetchPayrolls();
  }, [currentUserId, selectedMonth, filterStatus]);

  const fetchPayrolls = async () => {
    setLoading(true);
    
    // İlişkili tablodan (employees) isim, avatar, departman çek
    let query = supabase
      .from('payrolls')
      .select(`
        *,
        employees ( name, avatar, department )
      `)
      .eq('period', selectedMonth) // Sadece seçili ayı getir
      .order('id', { ascending: false });

    // Eğer yönetici değilse sadece kendi maaşını gör
    if (!isManager) {
      query = query.eq('employee_id', currentUserId);
    }

    const { data, error } = await query;
    if (error) console.error("Payroll Error:", error);
    else {
      // Filtreleme (Frontend tarafında yapılabilir veya query'e eklenebilir)
      const filtered = filterStatus === 'All' 
        ? data 
        : data.filter(p => p.status === filterStatus);
      setPayrolls(filtered || []);
    }
    setLoading(false);
  };

  // --- 2. MAAŞLARI HESAPLA (Sadece HR/GM) ---
  const handleRunPayroll = async () => {
    if (!window.confirm(`${selectedMonth} dönemi için maaşları hesaplamak istiyor musunuz?`)) return;
    
    setCalculating(true);
    try {
      // A) Önce tüm AKTİF çalışanları ve maaşlarını çek
      const { data: activeEmployees } = await supabase
        .from('employees')
        .select('id, salary')
        .eq('status', 'Active');

      if (!activeEmployees || activeEmployees.length === 0) throw new Error("Aktif çalışan bulunamadı.");

      // B) Bu ay için zaten kayıt var mı kontrol et (Çift kayıt olmasın)
      // (Basitlik adına: Supabase insert sırasında conflict olmasın diye kontrol edilebilir ama şimdilik direkt ekliyoruz)
      
      // C) Kayıtları Hazırla
      const payrollRecords = activeEmployees.map(emp => {
        const base = emp.salary / 12; // Yıllık maaşı aya böl
        const tax = base * 0.15; // %15 Vergi (Örnek)
        const bonus = 0; // Varsayılan bonus
        const net = base - tax + bonus;

        return {
          employee_id: emp.id,
          period: selectedMonth,
          base_salary: Math.floor(base),
          deductions: Math.floor(tax),
          bonus: bonus,
          net_pay: Math.floor(net),
          status: 'Pending', // Bekliyor
          payment_date: null
        };
      });

      // D) Toplu Ekleme (Bulk Insert)
      const { error } = await supabase.from('payrolls').insert(payrollRecords);

      if (error) throw error;
      
      alert(`${payrollRecords.length} personelin maaş kaydı oluşturuldu!`);
      fetchPayrolls();

    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  // --- 3. ÖDEME YAPILDI İŞARETLE ---
  const handleMarkAsPaid = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('payrolls')
      .update({ status: 'Paid', payment_date: today })
      .eq('id', id);

    if (!error) fetchPayrolls();
  };

  // --- İSTATİSTİKLER ---
  const totalPayout = payrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const pendingCount = payrolls.filter(p => p.status === 'Pending').length;
  const paidCount = payrolls.filter(p => p.status === 'Paid').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* BAŞLIK VE KONTROLLER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bordro ve Maaşlar</h1>
          <p className="text-gray-500">
             {isManager ? 'Personel maaş ödemelerini yönetin.' : 'Maaş bordrolarınızı görüntüleyin.'}
          </p>
        </div>

        <div className="flex gap-3">
            {/* Dönem Seçici */}
            <input 
              type="month" 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            {/* Maaş Hesapla Butonu (Sadece Yönetici) */}
            {isManager && (
              <button 
                onClick={handleRunPayroll}
                disabled={calculating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 {calculating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />}
                 <span>Hesaplamayı Başlat</span>
              </button>
            )}
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Toplam Ödenecek</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-1">${totalPayout.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Ödenen Personel</p>
           <h3 className="text-3xl font-bold text-green-600 mt-1">{paidCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <p className="text-sm font-medium text-gray-500">Bekleyen Ödeme</p>
           <h3 className="text-3xl font-bold text-orange-500 mt-1">{pendingCount}</h3>
        </div>
      </div>

      {/* TABLO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filtre Tabları */}
        <div className="p-4 border-b border-gray-100 flex gap-2 bg-gray-50/50 overflow-x-auto">
             {['All', 'Pending', 'Paid'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      filterStatus === status 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {status === 'All' ? 'Tümü' : status === 'Pending' ? 'Bekleyenler' : 'Ödenenler'}
                </button>
             ))}
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                 <tr>
                    <th className="px-6 py-4">Personel</th>
                    <th className="px-6 py-4">Dönem</th>
                    <th className="px-6 py-4">Brüt</th>
                    <th className="px-6 py-4 text-red-500">Kesinti</th>
                    <th className="px-6 py-4 text-green-600 font-bold">Net Ödenen</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></td></tr>
                 ) : payrolls.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                {row.employees?.name?.slice(0,2).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-bold text-gray-800">{row.employees?.name}</p>
                                <p className="text-xs text-gray-400">{row.employees?.department}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-gray-600 font-mono">{row.period}</td>
                       <td className="px-6 py-4 text-gray-600">${row.base_salary.toLocaleString()}</td>
                       <td className="px-6 py-4 text-red-500">-${row.deductions.toLocaleString()}</td>
                       <td className="px-6 py-4 font-bold text-gray-800 bg-green-50/50">${row.net_pay.toLocaleString()}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                             row.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                             {row.status === 'Paid' ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                             {row.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             {/* Bordro İndir (Mock Action) */}
                             <button title="Bordro İndir" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <FileText className="w-4 h-4" />
                             </button>

                             {/* Ödeme Yap Butonu (Sadece Yönetici ve Bekliyorsa) */}
                             {isManager && row.status === 'Pending' && (
                                <button 
                                  onClick={() => handleMarkAsPaid(row.id)}
                                  title="Ödendi İşaretle" 
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                >
                                   <DollarSign className="w-4 h-4" />
                                </button>
                             )}
                          </div>
                       </td>
                    </tr>
                 ))}

                 {!loading && payrolls.length === 0 && (
                    <tr><td colSpan="7" className="p-12 text-center text-gray-400">
                       <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                       <p>Bu dönem için maaş kaydı bulunamadı.</p>
                    </td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}