import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Play, Square, Clock, CalendarCheck, CheckCircle2, History } from 'lucide-react';

export default function TimeTracking({ currentUserId, userRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayLogId, setTodayLogId] = useState(null);

  // Verileri Çek
  useEffect(() => {
    fetchLogs();
    checkTodayStatus();
  }, [currentUserId, userRole]);

  // Bugün giriş yapmış mı kontrol et
  const checkTodayStatus = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', currentUserId)
      .eq('date', today)
      .single();

    if (data) {
      setTodayLogId(data.id);
      // Eğer çıkış saati yoksa hala içeridedir
      setIsCheckedIn(!data.check_out);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('time_logs')
        .select(`
            *,
            employees:employee_id (name, avatar, department)
        `)
        .order('date', { ascending: false })
        .order('check_in', { ascending: false });

      // 🔒 GÜVENLİK: Çalışan sadece kendini görsün
      if (userRole === 'employee') {
         query = query.eq('employee_id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Log hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // GİRİŞ YAP
  const handleCheckIn = async () => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          employee_id: currentUserId,
          date: dateString,
          check_in: timeString,
          status: 'Present'
        })
        .select()
        .single();

      if (error) throw error;
      
      setTodayLogId(data.id);
      setIsCheckedIn(true);
      fetchLogs(); // Listeyi yenile
    } catch (err) {
      alert("Giriş hatası: " + err.message);
    }
  };

  // ÇIKIŞ YAP
  const handleCheckOut = async () => {
    if (!todayLogId) return;
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    try {
      // Çıkış saatini güncelle
      const { error } = await supabase
        .from('time_logs')
        .update({
          check_out: timeString,
          // Basit süre hesabı (Backend'de trigger ile yapılması daha sağlıklıdır ama burada JS ile basitçe tutuyoruz)
          status: 'Completed' 
        })
        .eq('id', todayLogId);

      if (error) throw error;

      setIsCheckedIn(false);
      fetchLogs();
    } catch (err) {
      alert("Çıkış hatası: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
       {/* ÜST KISIM: BAŞLIK VE BUTONLAR */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Zaman Takibi</h1>
            <p className="text-gray-500">Mesai saatlerinizi kaydedin ve takip edin.</p>
          </div>

          {/* GİRİŞ / ÇIKIŞ KARTI */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
             {isCheckedIn ? (
                <button 
                  onClick={handleCheckOut}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-100 transition-all border border-red-100"
                >
                  <Square className="w-5 h-5 fill-current" /> Çıkış Yap
                </button>
             ) : (
                <button 
                  onClick={handleCheckIn}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-green-100 transition-all border border-green-100"
                >
                  <Play className="w-5 h-5 fill-current" /> Giriş Yap
                </button>
             )}
             
             <div className="h-10 w-px bg-gray-200 mx-2"></div>
             
             <div className="pr-4">
               <p className="text-xs text-gray-400 font-bold uppercase">Şu anki Durum</p>
               <div className="flex items-center gap-1.5 font-bold text-gray-700">
                 <Clock className={`w-4 h-4 ${isCheckedIn ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                 {isCheckedIn ? 'Çalışıyor' : 'Mola / Dışarıda'}
               </div>
             </div>
          </div>
       </div>

       {/* TABLO */}
       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
             <History className="w-4 h-4 text-gray-500"/>
             <h3 className="text-sm font-bold text-gray-700">Hareket Geçmişi</h3>
          </div>
          
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                <tr>
                   <th className="px-6 py-4 font-bold">Tarih</th>
                   <th className="px-6 py-4 font-bold">Personel</th>
                   <th className="px-6 py-4 font-bold text-green-600">Giriş</th>
                   <th className="px-6 py-4 font-bold text-red-500">Çıkış</th>
                   <th className="px-6 py-4 font-bold">Durum</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                   <tr><td colSpan="5" className="p-8 text-center text-gray-500">Henüz kayıt yok.</td></tr>
                ) : (
                   logs.map(log => (
                   <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700 tabular-nums">
                         <div className="flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-gray-400"/>
                            {new Date(log.date).toLocaleDateString('tr-TR')}
                         </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                         {/* Kendi kaydıysa 'Siz' yazsın */}
                         {log.employee_id === currentUserId ? 'Siz' : log.employees?.name}
                      </td>
                      <td className="px-6 py-4 text-green-700 font-bold tabular-nums bg-green-50/30">
                         {log.check_in ? log.check_in.slice(0,5) : '--:--'}
                      </td>
                      <td className="px-6 py-4 text-red-600 font-bold tabular-nums bg-red-50/30">
                         {log.check_out ? log.check_out.slice(0,5) : '--:--'}
                      </td>
                      <td className="px-6 py-4">
                         {log.check_out ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                               <CheckCircle2 className="w-3 h-3"/> Tamamlandı
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 animate-pulse">
                               <Clock className="w-3 h-3"/> İçeride
                            </span>
                         )}
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