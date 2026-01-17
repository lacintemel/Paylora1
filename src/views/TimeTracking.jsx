import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Search, 
  Download, 
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { employeesData } from '../data/mockData';

export default function TimeTracking() {
  // --- MOCK VERİLER (Zaman Kayıtları) ---
  // Gerçek hayatta bu veriler veritabanından gelir.
  const initialLogs = [
    { id: 1, empId: 1, date: '2026-01-17', in: '08:55', out: null, status: 'Active' }, // Çıkış yapmamış (Hala ofiste)
    { id: 2, empId: 2, date: '2026-01-17', in: '09:15', out: null, status: 'Late' },   // Geç kalmış ve hala ofiste
    { id: 3, empId: 3, date: '2026-01-17', in: '09:00', out: '18:00', status: 'OnTime' },
    { id: 4, empId: 4, date: '2026-01-17', in: '08:45', out: '18:15', status: 'Overtime' },
    { id: 5, empId: 1, date: '2026-01-16', in: '09:00', out: '18:00', status: 'OnTime' },
    { id: 6, empId: 2, date: '2026-01-16', in: '09:30', out: '18:30', status: 'Late' },
  ];

  // --- STATE ---
  const [logs] = useState(initialLogs);
  const [selectedDate, setSelectedDate] = useState('2026-01-17'); // Bugünün tarihi
  const [searchTerm, setSearchTerm] = useState('');

  // --- HESAPLAMALAR VE FİLTRELEME ---
  
  // 1. Veriyi Zenginleştirme (Çalışan ismini ekle)
  const enrichedLogs = logs.map(log => {
    const employee = employeesData.find(e => e.id === log.empId);
    return { ...log, employee };
  });

  // 2. Filtreleme
  const filteredLogs = enrichedLogs.filter(log => {
    const matchesDate = log.date === selectedDate;
    const matchesSearch = log.employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // 3. İstatistikler (Seçili Gün İçin)
  const presentCount = filteredLogs.length;
  const lateCount = filteredLogs.filter(l => l.status === 'Late').length;
  const activeCount = filteredLogs.filter(l => l.out === null).length; // Çıkış saati olmayanlar

  // Süre Hesaplama Yardımcısı
  const calculateDuration = (inTime, outTime) => {
    if (!outTime) return 'Hesaplanıyor...';
    
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    
    let hours = outH - inH;
    let minutes = outM - inM;
    
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }
    
    return `${hours}s ${minutes}d`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Zaman Takibi ve Mesai</h1>
          <p className="text-gray-500">Günlük giriş-çıkış raporları.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Excel Raporu
        </button>
      </div>

      {/* --- İSTATİSTİK KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kart 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Bugün Ofiste</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{presentCount} Kişi</h3>
            <p className="text-xs text-green-600 mt-1">{activeCount} kişi hala aktif</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Kart 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Geç Kalanlar</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{lateCount} Kişi</h3>
            <p className="text-xs text-red-500 mt-1">Mesai başlangıcı 09:00</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Kart 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Ortalama Mesai</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">8s 45d</h3>
            <p className="text-xs text-gray-400 mt-1">Hedef: 9s 00d</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <Timer className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- FİLTRE VE TABLO --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Filtre Alanı */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
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
        </div>

        {/* Tablo */}
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {log.employee?.avatar || '??'}
                    </div>
                    <span className="font-medium text-gray-900">{log.employee?.name || 'Bilinmiyor'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{log.date}</td>
                  <td className="px-6 py-4 font-mono text-gray-800">{log.in}</td>
                  <td className="px-6 py-4 font-mono text-gray-500">
                    {log.out ? log.out : <span className="text-green-600 animate-pulse text-xs font-bold">● OFİSTE</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {calculateDuration(log.in, log.out)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      log.status === 'Late' ? 'bg-red-100 text-red-700' :
                      log.status === 'Overtime' ? 'bg-purple-100 text-purple-700' :
                      log.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {log.status === 'Late' ? 'Geç Kaldı' :
                       log.status === 'Overtime' ? 'Fazla Mesai' :
                       log.status === 'Active' ? 'Çalışıyor' : 'Zamanında'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Bu tarihe ait kayıt bulunamadı.</p>
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