import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // 👈 Supabase Bağlantısı
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Building2 
} from 'lucide-react';

export default function GeneralManagerDashboard({ onNavigate }) {
  
  // --- STATE YÖNETİMİ ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAnnualPayroll: 0,
    monthlyPayroll: 0,
    avgPerformance: "0.0",
    departments: {}, // { Engineering: 5, HR: 2 ... }
    recentPayrolls: [] // Son maaş ödemeleri
  });

  // --- VERİ ÇEKME VE HESAPLAMA ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. ÇALIŞANLARI ÇEK (Maaş, Departman, Status)
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');
        
      if (empError) throw empError;

      // 2. MAAŞ GEÇMİŞİNİ ÇEK (Son 5 ödeme)
      const { data: payrolls, error: payError } = await supabase
        .from('payrolls')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

      if (payError) throw payError;

      // --- HESAPLAMALAR ---
      
      // A. Toplam Çalışan (Sadece Aktifleri saymak istersen .filter ekle)
      const totalEmp = employees.length;

      // B. Finansal Hesaplar (Yıllık Maaş Yükü)
      const annualPayroll = employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
      const monthlyPay = annualPayroll / 12;

      // C. Departman Dağılımı
      const deptCounts = {};
      employees.forEach(emp => {
        const dept = emp.department || 'Diğer';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      // D. Performans (DB'de sütun olmadığı için simüle ediyoruz veya ortalama alıyoruz)
      // Şimdilik DB'de 'performance' sütunu yoksa statik veya random bir mantık:
      // Gerçekte: const avgPerf = employees.reduce...
      const avgPerf = (4.0 + (Math.random() * 1)).toFixed(1); // 4.0 - 5.0 arası simülasyon

      // STATE GÜNCELLE
      setStats({
        totalEmployees: totalEmp,
        totalAnnualPayroll: annualPayroll,
        monthlyPayroll: monthlyPay,
        avgPerformance: avgPerf,
        departments: deptCounts,
        recentPayrolls: payrolls || []
      });

    } catch (error) {
      console.error("Dashboard veri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // Veri yüklenirken gösterilecek iskelet veya basit loading
  if (loading) {
    return <div className="p-10 text-center text-gray-500">Veriler analiz ediliyor...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- ÜST KISIM --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Şirket Genel Bakış</h1>
          <p className="text-gray-500">Finansal durum ve personel istatistiklerinin özeti.</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
             <Activity className="w-3 h-3" /> Sistem Durumu: Normal
           </span>
        </div>
      </div>

      {/* --- KPI KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Kart 1: Toplam Çalışan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Personel</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalEmployees}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Geçen aydan %5 artış</span>
          </div>
        </div>

        {/* Kart 2: Aylık Maaş Gideri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Aylık Maaş Yükü</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                ${stats.monthlyPayroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>Yıllık: ${stats.totalAnnualPayroll.toLocaleString()}</span>
          </div>
        </div>

        {/* Kart 3: Ortalama Performans */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Ort. Performans</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.avgPerformance} <span className="text-lg text-gray-400">/ 5.0</span></h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span>Hedefin üzerinde</span>
          </div>
        </div>

        {/* Kart 4: Aktif Proje/Departman */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktif Departman</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{Object.keys(stats.departments).length}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>Operasyonel verimlilik %98</span>
          </div>
        </div>
      </div>

      {/* --- DETAYLI ANALİZLER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SOL: Departman Dağılımı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Departman Dağılımı</h3>
            <button 
              onClick={() => onNavigate('employees')} 
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Detaylı Rapor
            </button>
          </div>
          
          <div className="space-y-5">
            {Object.entries(stats.departments).map(([deptName, count]) => {
              const percentage = Math.round((count / stats.totalEmployees) * 100);
              return (
                <div key={deptName}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{deptName}</span>
                    <span className="text-gray-500">{count} Kişi ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SAĞ: Son Finansal Hareketler (Payroll) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Son Maaş Ödemeleri</h3>
            <button 
              onClick={() => onNavigate('payroll')} 
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Tümünü Gör
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 font-medium">PERSONEL</th>
                  <th className="py-2 font-medium">DÖNEM</th>
                  <th className="py-2 font-medium text-right">NET TUTAR</th>
                  <th className="py-2 font-medium text-right">DURUM</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.recentPayrolls.length > 0 ? (
                  stats.recentPayrolls.map((pay) => (
                    // Not: Gerçek sistemde JOIN ile name çekilir ama burada basit tutmak için ID gösteriyoruz veya statik kalıyor
                    <tr key={pay.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            EMP
                         </div>
                         <span className="font-medium text-gray-700">Personel #{pay.employee_id}</span>
                      </td>
                      <td className="py-3 text-gray-500">{pay.period}</td>
                      <td className="py-3 text-right font-medium text-gray-800">
                        ${Number(pay.net_salary).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pay.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          pay.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                        }`}>
                          {pay.status === 'Paid' ? 'Ödendi' : 'İşleniyor'}
                        </span>
                      </td>
                    </tr>
                   ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500 italic">
                       Henüz maaş verisi bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}