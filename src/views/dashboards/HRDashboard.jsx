import React from 'react';
import { 
  Users, 
  UserPlus, 
  FileWarning, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { employeesData } from '../../data/mockData';

export default function HRDashboard() {
  // --- 1. BASİT HESAPLAMALAR ---
  const totalEmployees = employeesData.length;
  const activeEmployees = employeesData.filter(e => e.status === 'Active').length;
  
  // Deneme süresi (Start Date 6 aydan yakın olanlar) - Simülasyon
  const onProbation = employeesData.filter(e => {
    const start = new Date(e.startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays < 180; // 6 aydan yeni
  }).length;

  // İşe Alım Mock Verisi (Henüz veritabanımızda olmadığı için)
  const recruitmentStats = [
    { id: 1, role: 'Frontend Developer', applied: 45, interview: 12, offer: 2, status: 'Acil' },
    { id: 2, role: 'Product Manager', applied: 28, interview: 5, offer: 0, status: 'Aktif' },
    { id: 3, role: 'UX Designer', applied: 15, interview: 8, offer: 1, status: 'Aktif' },
  ];

  // Yaklaşan Olaylar Mock Verisi
  const upcomingEvents = [
    { id: 1, title: 'Ali Yılmaz - Sözleşme Bitişi', date: '2 Gün Sonra', type: 'warning' },
    { id: 2, title: 'Ayşe Demir - Doğum Günü 🎂', date: '15 Ocak', type: 'celebration' },
    { id: 3, title: 'Mehmet Kaya - 3. Yıl Dönümü t🎉', date: '20 Ocak', type: 'celebration' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İK Operasyon Merkezi</h1>
          <p className="text-gray-500">İşe alım süreçleri ve personel durum özeti.</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Yeni İlan Aç
        </button>
      </div>

      {/* --- KPI KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Kart 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Personel</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalEmployees}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-green-600 font-medium">aktif çalışan</p>
        </div>

        {/* Kart 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Açık Pozisyonlar</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{recruitmentStats.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Search className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Toplam 88 başvuru</p>
        </div>

        {/* Kart 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Deneme Süreci</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{onProbation}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-orange-600 font-medium">takip gerekli</p>
        </div>

        {/* Kart 4 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Eksik Evrak</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">3</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <FileWarning className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-red-600 font-medium">aciliyet yüksek</p>
        </div>
      </div>

      {/* --- ANA İÇERİK IZGARASI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL: İşe Alım Tablosu (Geniş Alan) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Aktif İşe Alım Süreçleri</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100 uppercase bg-gray-50">
                  <th className="py-3 px-4 font-medium rounded-l-lg">Pozisyon</th>
                  <th className="py-3 px-4 font-medium text-center">Başvuru</th>
                  <th className="py-3 px-4 font-medium text-center">Mülakat</th>
                  <th className="py-3 px-4 font-medium text-center">Teklif</th>
                  <th className="py-3 px-4 font-medium text-right rounded-r-lg">Durum</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recruitmentStats.map((job) => (
                  <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {job.role}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">{job.applied}</td>
                    <td className="py-4 px-4 text-center text-blue-600 font-medium">{job.interview}</td>
                    <td className="py-4 px-4 text-center text-green-600 font-medium">{job.offer}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'Acil' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button className="text-sm text-purple-600 font-medium hover:underline">Tüm Başvuruları İncele →</button>
          </div>
        </div>

        {/* SAĞ: Hatırlatıcılar ve Uyarılar (Dar Alan) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Yaklaşan Olaylar
          </h3>
          
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${event.type === 'warning' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-xl">
             <h4 className="text-sm font-bold text-purple-900 mb-2">Hızlı Aksiyon</h4>
             <button className="w-full bg-white text-purple-700 text-xs font-bold py-2 rounded border border-purple-200 hover:bg-purple-100 mb-2">
                Bordro Onayla
             </button>
             <button className="w-full bg-white text-purple-700 text-xs font-bold py-2 rounded border border-purple-200 hover:bg-purple-100">
                Yıllık İzin Planı
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}