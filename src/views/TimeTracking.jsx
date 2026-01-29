import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Play, Square, Clock, CalendarCheck, CheckCircle2, History } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';
import { recordAttendance } from '../utils/attendanceUtils';

export default function TimeTracking({ currentUserId, userRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayLogId, setTodayLogId] = useState(null);
  const [startTime, setStartTime] = useState(null); // Süre hesabı için giriş saatini tutalım
  const [elapsedTime, setElapsedTime] = useState(0); // Geçen süre (saniye cinsinden)

  // Verileri Çek
  useEffect(() => {
    if (currentUserId) {
        fetchLogs();
        checkTodayStatus();
    }
  }, [currentUserId, userRole]);

  // Geçen zamanı güncelle (her saniye)
  useEffect(() => {
    let interval;
    if (isCheckedIn && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, startTime]);

  // Bugün giriş yapmış mı kontrol et
  const checkTodayStatus = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', currentUserId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTodayLogId(data.id);
      // Eğer çıkış saati yoksa hala içeridedir
      const stillInside = !data.clock_out;
      setIsCheckedIn(stillInside);
      if (stillInside) setStartTime(new Date(data.clock_in));
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
            *,
            employees:employee_id (name, avatar, department)
        `)
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false });

      // 🔒 GÜVENLİK: Çalışan sadece kendini görsün, Yönetici herkesi
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

  // --- 🟢 GİRİŞ YAP ---
  const handleCheckIn = async () => {
    try {
      const result = await recordAttendance(currentUserId, 'in');
      
      if (result.success) {
        setIsCheckedIn(true);
        setStartTime(new Date());
        setElapsedTime(0);
        fetchLogs();
        checkTodayStatus();
        showSuccess('Günaydın! Mesaiye başladınız.');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showError("Giriş hatası: " + err.message);
    }
  };

  // --- 🔴 ÇIKIŞ YAP ---
  const handleCheckOut = async () => {
    try {
      const result = await recordAttendance(currentUserId, 'out');
      
      if (result.success) {
        setIsCheckedIn(false);
        setStartTime(null);
        setElapsedTime(0);
        fetchLogs();
        checkTodayStatus();
        showSuccess('Çıkış yapıldı! İyi günler.');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showError("Çıkış hatası: " + err.message);
    }
  };

  // Geçen zamanı formatla
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}s ${minutes}d`;
  };

  // Tabloda saati düzgün göstermek için yardımcı fonksiyon
  const formatTime = (isoString) => {
      if (!isoString) return '--:--';
      // "2026-01-23T15:40:00" -> "15:40"
      return new Date(isoString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       
       {/* ÜST KISIM */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600"/> Zaman Takibi
            </h1>
            <p className="text-gray-500 text-sm">Mesai saatlerinizi kaydedin ve takip edin.</p>
          </div>

          {/* GİRİŞ / ÇIKIŞ KARTI */}
          <div className="flex items-center gap-4 w-full md:w-auto">
             {isCheckedIn ? (
                <button 
                  onClick={handleCheckOut}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  <Square className="w-5 h-5 fill-current" /> Çıkış Yap
                </button>
             ) : (
                <button 
                  onClick={handleCheckIn}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" /> Giriş Yap
                </button>
             )}
             
             <div className="hidden md:block h-10 w-px bg-gray-200 mx-2"></div>
             
             <div className="hidden md:block pr-4">
               <p className="text-xs text-gray-400 font-bold uppercase">Durum</p>
               <div className="flex items-center gap-1.5 font-bold text-gray-700">
                 <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                 {isCheckedIn ? 'Mesai Başladı' : 'Mesai Dışı'}
               </div>
             </div>
          </div>
       </div>

       {/* TABLO */}
       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
             <History className="w-4 h-4 text-gray-500"/>
             <h3 className="text-sm font-bold text-gray-700">Hareket Geçmişi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                    <tr>
                    <th className="px-6 py-4 font-bold">Tarih</th>
                    <th className="px-6 py-4 font-bold">Personel</th>
                    <th className="px-6 py-4 font-bold text-green-600">Giriş</th>
                    <th className="px-6 py-4 font-bold text-red-500">Çıkış</th>
                    <th className="px-6 py-4 font-bold">Durum</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">Yükleniyor...</td></tr>
                    ) : logs.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">Henüz kayıt yok.</td></tr>
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
                            {log.employee_id === currentUserId ? 'Siz' : log.employees?.name || 'Bilinmiyor'}
                        </td>
                        <td className="px-6 py-4 text-green-700 font-bold tabular-nums">
                            <span className="bg-green-50 px-2 py-1 rounded">
                                {formatTime(log.clock_in)}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-red-700 font-bold tabular-nums">
                            <span className="bg-red-50 px-2 py-1 rounded">
                                {formatTime(log.clock_out)}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {log.clock_out ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600"/>
                                    <span className="text-green-700 font-bold">{log.worked_hours ? log.worked_hours.toFixed(1) + 's' : 'Tamamlandı'}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-blue-700 font-bold">{formatElapsedTime(elapsedTime)}</span>
                                </div>
                            )}
                        </td>
                    </tr>
                    ))
                    )}
                </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}