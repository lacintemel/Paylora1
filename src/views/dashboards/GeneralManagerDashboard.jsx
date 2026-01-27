import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 
import { 
  TrendingUp, Users, DollarSign, Activity, Briefcase, 
  ArrowUpRight, CreditCard, PieChart
} from 'lucide-react';
import DashboardAnnouncements from '../../components/DashboardAnnouncements';

export default function GeneralManagerDashboard({ onNavigate, currentUser, userRole }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    monthlyCost: 0,
    pendingPayroll: 0,
    avgSalary: 0
  });
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    topSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const currentPeriod = new Date().toISOString().slice(0, 7); // "2026-01"
      const currentMonth = new Date().toISOString().slice(0, 7);

      // 1. Çalışan İstatistikleri
      const { data: emps, error: empError } = await supabase.from('employees').select('salary');
      if (empError) throw empError;

      const totalEmps = emps.length;
      const avgSal = totalEmps > 0 ? emps.reduce((sum, e) => sum + Number(e.salary), 0) / totalEmps : 0;

      // 2. Finansallar
      const { data: payrolls, error: payError } = await supabase.from('payrolls').select('net_pay, status').eq('period', currentPeriod);
      if (payError) throw payError;

      const totalCost = payrolls?.reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;
      const pendingCount = payrolls?.filter(p => p.status === 'Pending').length || 0;

      // 3. Satışlar (Bu Ay)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('month', currentMonth)
        .order('amount', { ascending: false })
        .limit(5);
      
      if (!salesError && salesData) {
        const totalSalesAmount = salesData.reduce((sum, s) => sum + Number(s.amount), 0);
        setSalesStats({
          totalSales: salesData.length,
          totalAmount: totalSalesAmount,
          topSales: salesData
        });
      }

      setStats({
        totalEmployees: totalEmps,
        monthlyCost: totalCost,
        pendingPayroll: pendingCount,
        avgSalary: Math.floor(avgSal)
      });

    } catch (error) {
      console.error("Dashboard Veri Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Genel Bakış</h1>
          <p className="text-gray-500">Şirket finansalları ve personel durumu.</p>
        </div>
        <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
           {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Dönemi
        </div>
      </div>

      {/* KPI KARTLARI (Senin Kodun) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
           <div className="flex justify-between items-start">
              <div><p className="text-sm font-bold text-gray-500">Aylık Maaş Gideri</p><h3 className="text-2xl font-bold text-gray-800 mt-1">${loading ? '...' : stats.monthlyCost.toLocaleString()}</h3></div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
           </div>
           {stats.pendingPayroll > 0 && (<p className="text-xs font-bold text-orange-500 flex items-center gap-1"><Activity className="w-3 h-3"/> {stats.pendingPayroll} ödeme bekliyor</p>)}
        </div>

        <div onClick={() => onNavigate('employees')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 cursor-pointer hover:border-blue-200 transition-colors">
           <div className="flex justify-between items-start">
              <div><p className="text-sm font-bold text-gray-500">Toplam Personel</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{loading ? '...' : stats.totalEmployees}</h3></div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
           </div>
           <p className="text-xs text-green-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Geçen aya göre stabil</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
           <div className="flex justify-between items-start">
              <div><p className="text-sm font-bold text-gray-500">Ort. Yıllık Maaş</p><h3 className="text-2xl font-bold text-gray-800 mt-1">${loading ? '...' : stats.avgSalary.toLocaleString()}</h3></div>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Briefcase className="w-5 h-5" /></div>
           </div>
           <p className="text-xs text-gray-400">Sektör ortalamasında</p>
        </div>

        <div onClick={() => onNavigate('sales')} className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-32 cursor-pointer hover:shadow-xl transition-shadow">
           <div className="flex justify-between items-start">
              <div><p className="text-sm font-bold text-emerald-200">Bu Ay Satışlar</p><h3 className="text-2xl font-bold mt-1">${loading ? '...' : salesStats.totalAmount.toLocaleString()}</h3></div>
              <div className="p-2 bg-white/10 rounded-lg text-white"><TrendingUp className="w-5 h-5" /></div>
           </div>
           <p className="text-xs text-emerald-200 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {salesStats.totalSales} işlem</p>
        </div>
      </div>

      {/* --- YENİ DÜZEN (Grid Layout) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* SOL TARAFA DUYURULARI EKLEDİK (Geniş Alan - span-2) */}
          <div className="lg:col-span-2 h-full min-h-[400px]">
              <DashboardAnnouncements userRole={userRole} currentUser={currentUser} onNavigate={onNavigate}/>
          </div>

          {/* SAĞ TARAFA SENİN ESKİ CHART VE AKSİYONLARINI KOYDUK */}
          <div className="space-y-6">
              {/* Finansal Aksiyonlar */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600"/> Finansal Aksiyonlar</h3>
                 {stats.pendingPayroll > 0 ? (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                       <h4 className="font-bold text-orange-800 text-sm">Maaş Ödemeleri Bekliyor</h4>
                       <p className="text-xs text-orange-600 mt-1 mb-3">{stats.pendingPayroll} personelin ödemesi onay bekliyor.</p>
                       <button onClick={() => onNavigate('payroll')} className="w-full bg-white text-orange-600 px-3 py-2 rounded-lg text-xs font-bold border border-orange-200 hover:bg-orange-100 transition-colors">İncele & Öde</button>
                    </div>
                 ) : (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                       <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600"><TrendingUp className="w-4 h-4"/></div>
                       <div><h4 className="font-bold text-green-800 text-sm">Her Şey Yolunda</h4><p className="text-xs text-green-600">Tüm ödemeler tamamlandı.</p></div>
                    </div>
                 )}
              </div>

              {/* Departman Dağılımı */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-600"/> Departman Dağılımı</h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-600">Engineering</span><div className="w-2/3 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[60%]"></div></div><span className="text-[10px] font-bold text-gray-500">60%</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-600">Sales</span><div className="w-2/3 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[25%]"></div></div><span className="text-[10px] font-bold text-gray-500">25%</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-600">HR</span><div className="w-2/3 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 w-[15%]"></div></div><span className="text-[10px] font-bold text-gray-500">15%</span></div>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
}