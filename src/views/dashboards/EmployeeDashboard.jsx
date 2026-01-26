import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  Clock, Calendar, DollarSign, Briefcase, CheckCircle 
} from 'lucide-react';
import DashboardAnnouncements from '../../components/DashboardAnnouncements';
import { getInitials, isValidImageUrl } from '../../utils/avatarHelper';

export default function EmployeeDashboard({ onNavigate, currentUser }) {
  const [stats, setStats] = useState({
    leaveBalance: 0,
    workedHours: 0,
    nextPayment: 'Belirlenmedi' // Varsayılan
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) fetchEmployeeData();
  }, [currentUser]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // 1. İzin Bakiyesi
      const { data: empData } = await supabase.from('employees').select('annual_leave_days').eq('id', currentUser.id).single();

      // 2. Çalışılan Saat
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: logs } = await supabase.from('time_logs').select('duration_minutes').eq('employee_id', currentUser.id).gte('date', startOfMonth);
      const totalMinutes = logs?.reduce((acc, log) => acc + (log.duration_minutes || 0), 0) || 0;
      const hours = Math.round(totalMinutes / 60);

      // 👇 3. DİNAMİK MAAŞ GÜNÜ (Takvimden Çekiyoruz)
      const todayStr = new Date().toISOString().split('T')[0]; // Bugünün tarihi
      
      const { data: nextPayrollEvent } = await supabase
        .from('calendar_events')
        .select('start_date')
        .eq('type', 'Payroll_Reminder')  // Tipi maaş olan
        .gte('start_date', todayStr)     // Bugünden sonraki
        .order('start_date', { ascending: true }) // En yakını
        .limit(1)
        .single();

      // Eğer takvimde varsa formatla, yoksa statik bir şey yaz
      let paymentDateDisplay = "Tarih Yok";
      if (nextPayrollEvent) {
          const d = new Date(nextPayrollEvent.start_date);
          paymentDateDisplay = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      } else {
          // Takvimde yoksa varsayılan olarak ayın 15'ini göster
          const fallbackDate = new Date();
          if(fallbackDate.getDate() > 15) fallbackDate.setMonth(fallbackDate.getMonth() + 1);
          fallbackDate.setDate(15);
          paymentDateDisplay = fallbackDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      }

      setStats({
        leaveBalance: empData?.annual_leave_days || 0,
        workedHours: hours,
        nextPayment: paymentDateDisplay // Dinamik veri
      });

    } catch (error) {
      console.error("Veri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Hoş Geldin, {currentUser?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500">Bugün işler yolunda görünüyor.</p>
         </div>
         <div className="hidden md:block text-right">
             <p className="text-xs font-bold text-gray-400 uppercase">GÜNCEL TARİH</p>
             <p className="text-lg font-bold text-gray-800">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
         </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* İzin */}
         <div onClick={() => onNavigate('leave')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 cursor-pointer transition-all group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-bold text-gray-500">İzin Hakkı</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.leaveBalance} <span className="text-sm text-gray-400 font-medium">Gün</span></h3>
               </div>
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6"/></div>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-bold flex items-center gap-1">Talep Oluştur &rarr;</p>
         </div>

         {/* Çalışma */}
         <div onClick={() => onNavigate('time-tracking')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 cursor-pointer transition-all group">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-bold text-gray-500">Bu Ay Çalışma</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.workedHours} <span className="text-sm text-gray-400 font-medium">Saat</span></h3>
               </div>
               <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Clock className="w-6 h-6"/></div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Performansın gayet iyi 👍</p>
         </div>

         {/* Maaş Günü (ARTIK DİNAMİK) */}
         <div className="bg-gradient-to-br from-green-500 to-emerald-700 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-green-100 text-sm font-bold">Sonraki Ödeme</p>
               <h3 className="text-3xl font-bold mt-2">{stats.nextPayment}</h3>
               <p className="text-xs text-green-100 mt-3 opacity-80">Planlanan maaş günüdür.</p>
            </div>
            <DollarSign className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10 rotate-12"/>
         </div>
      </div>

      {/* DUYURULAR VE PROFİL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         <div className="lg:col-span-2 h-full min-h-[400px]">
            <DashboardAnnouncements userRole="employee" currentUser={currentUser} onNavigate={onNavigate} />
         </div>
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center items-center text-center h-full">
            <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {isValidImageUrl(currentUser?.avatar) ? <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover"/> : <span className="text-3xl font-bold text-gray-400">{getInitials(currentUser?.name || 'Bilinmiyor')}</span>}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{currentUser?.name}</h3>
            <p className="text-gray-500 text-sm mb-6">{currentUser?.role === 'employee' ? 'Personel' : currentUser?.role}</p>
            <div className="w-full space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Departman</span>
                    <span className="text-xs font-bold text-gray-800">{currentUser?.department || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Durum</span>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Aktif</span>
                </div>
            </div>
            <button onClick={() => onNavigate('settings')} className="mt-6 text-sm text-blue-600 font-bold hover:underline">Profil Ayarları</button>
         </div>
      </div>
    </div>
  );
}