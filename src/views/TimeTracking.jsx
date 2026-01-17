import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Clock, Calendar, Search, UserCheck, AlertTriangle, Loader2, ArrowRight
} from 'lucide-react';

export default function TimeTracking({ currentUserId, userRole }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ YÖNETİCİ KONTROLÜ (HR veya GM ise TRUE olur)
  const isManager = ['hr', 'general_manager'].includes(userRole);

  useEffect(() => {
    if (currentUserId) fetchLogs();
  }, [currentUserId, selectedDate, userRole]);

  const fetchLogs = async () => {
    setLoading(true);
    
    // Temel sorgu: Tarihe göre getir
    let query = supabase
      .from('time_logs')
      .select(`*, employees ( name, avatar, department )`)
      .eq('date', selectedDate)
      .order('check_in', { ascending: true });

    // ⛔ EĞER YÖNETİCİ DEĞİLSE -> SADECE KENDİ LOGLARINI GÖR
    if (!isManager) {
      query = query.eq('employee_id', currentUserId);
    }

    const { data, error } = await query;
    if (error) console.error("Log Hatası:", error);
    else setLogs(data || []);
    
    setLoading(false);
  };

  // --- SÜRE HESAPLAMA ---
  const calculateDuration = (inTime, outTime) => {
    if (!outTime) return 'Çalışıyor...';
    
    // Format "HH:MM:SS"
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    
    let hours = outH - inH;
    let minutes = outM - inM;
    
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }
    if (hours < 0) hours = 0;
    
    return `${hours}s ${minutes}d`;
  };

  // --- AVATAR HELPER ---
  const getAvatarContent = (log) => {
    const emp = log.employees;
    if (emp?.avatar && emp.avatar.startsWith('http')) {
        return <img src={emp.avatar} alt="Av" className="w-full h-full object-cover" />;
    }
    return emp?.name?.slice(0, 2).toUpperCase() || '??';
  };

  // --- FİLTRELEME (Yönetici Arama Yapabilir) ---
  const filteredLogs = logs.filter(log => {
    const name = log.employees?.name?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase());
  });

  // İstatistikler
  const presentCount = filteredLogs.length;
  const activeCount = filteredLogs.filter(l => !l.check_out).length;
  const lateCount = filteredLogs.filter(l => l.check_in > '09:00:00').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Zaman Takibi</h1>
          <p className="text-gray-500">
             {isManager ? 'Tüm personelin giriş-çıkış kayıtları.' : 'Günlük mesai kayıtlarım.'}
          </p>
        </div>
      </div>

      {/* İSTATİSTİKLER (Herkese Görünür) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Kayıtlı Giriş</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{presentCount}</h3>
            <p className="text-xs text-green-600 mt-1">{activeCount} kişi şu an aktif</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><UserCheck className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Geç Kalanlar</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{lateCount}</h3>
            <p className="text-xs text-red-500 mt-1">09:00 sonrası</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertTriangle className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Seçili Tarih</p>
            <h3 className="text-xl font-bold text-gray-800 mt-1">{selectedDate}</h3>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><Calendar className="w-6 h-6" /></div>
        </div>
      </div>

      {/* TABLO VE FİLTRELER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Üst Bar: Tarih ve Arama */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          {/* Arama Kutusu (Sadece Yönetici Görebilir) */}
          {isManager && (
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                type="text" 
                placeholder="Personel ara..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          )}
        </div>

        {/* Tablo İçeriği */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Personel</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Giriş</th>
                <th className="px-6 py-4">Çıkış</th>
                <th className="px-6 py-4">Süre</th>
                <th className="px-6 py-4 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></td></tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 overflow-hidden border border-white shadow-sm shrink-0">
                      {getAvatarContent(log)}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{log.employees?.name || 'Bilinmiyor'}</p>
                        {isManager && <p className="text-xs text-gray-400">{log.employees?.department}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{log.date}</td>
                  <td className="px-6 py-4 font-mono text-gray-800">{log.check_in?.slice(0,5)}</td>
                  <td className="px-6 py-4 font-mono text-gray-500">
                    {log.check_out ? log.check_out.slice(0,5) : <span className="text-green-600 animate-pulse text-xs font-bold">● OFİSTE</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {calculateDuration(log.check_in, log.check_out)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                       !log.check_out ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {!log.check_out ? 'Çalışıyor' : 'Tamamlandı'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>Kayıt bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}