import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 
import { 
  Play, Pause, Clock, Calendar, Briefcase, ArrowRight, Sun
} from 'lucide-react';

export default function EmployeeDashboard({ onNavigate, currentUser }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- KRONOMETRE STATE ---
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // 1. Aktif Oturumu Kontrol Et
  useEffect(() => {
    if (currentUser?.id) checkActiveSession();
  }, [currentUser]);

  // 2. Canlı Kronometre Mantığı
  useEffect(() => {
    let interval;
    if (activeSession) {
      interval = setInterval(() => {
        const now = new Date();
        // Giriş saatini tarih objesine çevir
        const [h, m, s] = activeSession.check_in.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(h, m, s || 0);
        
        const diff = now - startTime;
        
        // Saat, Dakika, Saniye Hesapla
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Formatla (01:05:09 gibi)
        const format = (num) => num.toString().padStart(2, '0');
        setElapsedTime(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const checkActiveSession = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', currentUser.id)
      .eq('date', today)
      .is('check_out', null)
      .single();

    if (data) setActiveSession(data);
  };

  const handlePunch = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    // ✅ SAAT FORMATINI GARANTİLE (24 SAAT)
    const now = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    const today = new Date().toISOString().split('T')[0];

    try {
      if (!activeSession) {
        // --- BAŞLAT ---
        const { data, error } = await supabase
          .from('time_logs')
          .insert([{
             employee_id: currentUser.id,
             date: today,
             check_in: now,
             status: 'Active'
          }])
          .select()
          .single();
          
        if (error) throw error;
        setActiveSession(data); 
      } else {
        // --- BİTİR ---
        const { error } = await supabase
          .from('time_logs')
          .update({
             check_out: now,
             status: 'Completed'
          })
          .eq('id', activeSession.id);

        if (error) throw error;
        setActiveSession(null); 
      }
    } catch (error) {
      alert("İşlem hatası: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'Tünaydın';
    return 'İyi Akşamlar';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BANNER --- */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><Sun className="w-32 h-32 text-white" /></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h1 className="text-3xl font-bold mb-2">{getGreeting()}, {currentUser?.name?.split(' ')[0]}! 👋</h1>
               <p className="text-blue-100 opacity-90">Bugünkü mesai durumun aşağıdadır.</p>
            </div>
            
            {/* KRONOMETRE KUTUSU */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex flex-col items-center gap-3 w-full md:w-auto min-w-[200px]">
               <div className="text-center">
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">
                    {activeSession ? 'Geçen Süre' : 'Mesai Başlamadı'}
                  </p>
                  {/* CANLI SAYAN SAAT */}
                  <p className="font-mono text-3xl font-bold tracking-wider">
                    {activeSession ? elapsedTime : '--:--:--'}
                  </p>
                  {activeSession && <p className="text-[10px] opacity-70 mt-1">Giriş: {activeSession.check_in.slice(0,5)}</p>}
               </div>
               
               <button 
                 onClick={handlePunch}
                 disabled={loading}
                 className={`w-full py-2.5 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                   activeSession 
                     ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                     : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                 }`}
               >
                 {loading ? <span className="animate-spin">⌛</span> : activeSession ? <><Pause className="w-4 h-4" /> Bitir</> : <><Play className="w-4 h-4" /> Başlat</>}
               </button>
            </div>
         </div>
      </div>

      {/* --- HIZLI MENÜLER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div onClick={() => onNavigate('leave')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-100"><Calendar className="w-6 h-6"/></div>
            </div>
            <h3 className="font-bold text-gray-800 text-lg">İzin Talepleri</h3>
            <p className="text-sm text-gray-500 mt-1">İzinlerini yönet.</p>
         </div>

         <div onClick={() => onNavigate('time-tracking')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100"><Clock className="w-6 h-6"/></div>
               <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Zaman Çizelgesi</h3>
            <p className="text-sm text-gray-500 mt-1">Geçmiş kayıtlarını incele.</p>
         </div>

         <div onClick={() => onNavigate('payroll')} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100"><Briefcase className="w-6 h-6"/></div>
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Bordrolar</h3>
            <p className="text-sm text-gray-500 mt-1">Maaş ödemelerini gör.</p>
         </div>
      </div>
    </div>
  );
}