import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 
import { 
  Users, Calendar, Clock, UserPlus, CheckCircle, AlertCircle, Search
} from 'lucide-react';

export default function HRDashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    activeEmployees: 0,
    pendingLeaves: 0,
    presentToday: 0
  });
  const [newHires, setNewHires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // 1. Aktif Çalışan Sayısı
      const { count: empCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      // 2. Bekleyen İzin Talepleri
      const { count: leaveCount } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // 3. Bugün Ofiste Olanlar (Zaman Kaydı Olanlar)
      const { count: presentCount } = await supabase
        .from('time_logs')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // 4. Son Eklenen 3 Çalışan
      const { data: latestEmps } = await supabase
        .from('employees')
        .select('name, position, department, avatar, start_date')
        .order('id', { ascending: false })
        .limit(3);

      setStats({
        activeEmployees: empCount || 0,
        pendingLeaves: leaveCount || 0,
        presentToday: presentCount || 0
      });
      setNewHires(latestEmps || []);

    } catch (error) {
      console.error("HR Veri Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // Avatar Helper
  const renderAvatar = (emp) => {
    if (emp.avatar && emp.avatar.startsWith('http')) {
        return <img src={emp.avatar} alt="av" className="w-full h-full object-cover"/>;
    }
    return emp.avatar || emp.name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İK Paneli</h1>
          <p className="text-gray-500">Operasyonel durum ve personel takibi.</p>
        </div>
        <button 
           onClick={() => onNavigate('employees')}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
           <UserPlus className="w-4 h-4"/> Personel Ekle
        </button>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aktif Personel */}
        <div onClick={() => onNavigate('employees')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 cursor-pointer transition-all flex items-center justify-between">
           <div>
              <p className="text-sm font-bold text-gray-500">Aktif Personel</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : stats.activeEmployees}</h3>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Sistemde kayıtlı</p>
           </div>
           <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users className="w-6 h-6"/></div>
        </div>

        {/* Bekleyen İzinler */}
        <div onClick={() => onNavigate('leave')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 cursor-pointer transition-all flex items-center justify-between">
           <div>
              <p className="text-sm font-bold text-gray-500">İzin Talepleri</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : stats.pendingLeaves}</h3>
              <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Onay bekliyor</p>
           </div>
           <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Calendar className="w-6 h-6"/></div>
        </div>

        {/* Ofiste Olanlar */}
        <div onClick={() => onNavigate('time-tracking')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-green-200 cursor-pointer transition-all flex items-center justify-between">
           <div>
              <p className="text-sm font-bold text-gray-500">Bugün Ofiste</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : stats.presentToday}</h3>
              <p className="text-xs text-gray-400 mt-1">Katılım oranı normal</p>
           </div>
           <div className="p-3 bg-green-50 rounded-xl text-green-600"><Clock className="w-6 h-6"/></div>
        </div>
      </div>

      {/* ALT BÖLÜM: YENİ KATILANLAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Son İşe Alımlar */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <UserPlus className="w-5 h-5 text-purple-600"/> Aramıza Yeni Katılanlar
            </h3>
            <div className="space-y-4">
               {newHires.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Henüz yeni kayıt yok.</p>
               ) : newHires.map((emp, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden border border-white shadow-sm">
                        {renderAvatar(emp)}
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-800 text-sm">{emp.name}</h4>
                        <p className="text-xs text-gray-500">{emp.position} • {emp.department}</p>
                     </div>
                     <div className="ml-auto text-xs text-gray-400">
                        {new Date(emp.start_date).toLocaleDateString('tr-TR')}
                     </div>
                  </div>
               ))}
            </div>
            <button onClick={() => onNavigate('employees')} className="w-full mt-4 text-sm text-blue-600 font-bold hover:underline">
               Tüm Personeli Gör
            </button>
         </div>

         {/* Hızlı Erişim (Mock) */}
         <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Performans Dönemi Yaklaşıyor</h3>
                <p className="text-indigo-200 text-sm mb-6">Yıllık değerlendirme süreci 1 Şubat'ta başlayacak. Form şablonlarını hazırlamayı unutmayın.</p>
                <button className="bg-white text-indigo-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
                   Süreci Planla
                </button>
             </div>
             {/* Dekoratif Arkaplan */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
         </div>
      </div>
    </div>
  );
}