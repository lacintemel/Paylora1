import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // 👈 BAĞLANTIYI EKLEDİK
import { 
  Users, 
  UserPlus, 
  FileWarning, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle,
  Briefcase,
  CheckSquare
} from 'lucide-react';

export default function HRDashboard({ onNavigate }) {
  
  // --- STATE ---
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    probation: 0, // Deneme süreci
    missingDocs: 3 // Şimdilik sabit (Belgeler tablosu bağlanınca değişir)
  });
  const [loading, setLoading] = useState(true);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Tüm çalışanları çek
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error("Dashboard hatası:", error);
    } else {
      // İstatistikleri Hesapla
      const total = employees.length;
      const active = employees.filter(e => e.status === 'Active').length;
      
      // Deneme Süreci: Son 180 gün (6 ay) içinde işe başlayanlar
      const probation = employees.filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const diffDays = Math.ceil(Math.abs(new Date() - start) / (1000 * 60 * 60 * 24)); 
        return diffDays < 180; 
      }).length;

      setStats({ total, active, probation, missingDocs: 3 });
    }
    setLoading(false);
  };

  // İşe Alım Mock Verisi (Adaylar tablosu bağlanınca burası da değişecek ama şimdilik görsel kalsın)
  const recruitmentStats = [
    { id: 1, role: 'Frontend Developer', applied: 45, interview: 12, offer: 2, status: 'Acil' },
    { id: 2, role: 'Product Manager', applied: 28, interview: 5, offer: 0, status: 'Aktif' },
    { id: 3, role: 'UX Designer', applied: 15, interview: 8, offer: 1, status: 'Aktif' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Ali Yılmaz - Sözleşme Bitişi', date: '2 Gün Sonra', type: 'warning' },
    { id: 2, title: 'Ayşe Demir - Doğum Günü 🎂', date: '15 Ocak', type: 'celebration' },
    { id: 3, title: 'Mehmet Kaya - 3. Yıl Dönümü 🎉', date: '20 Ocak', type: 'celebration' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK VE HIZLI AKSİYONLAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İK Operasyon Merkezi</h1>
          <p className="text-gray-500">İşe alım süreçleri ve personel durum özeti.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => onNavigate('leave')}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
                <Calendar className="w-4 h-4" /> Yıllık İzin Planı
            </button>
            <button 
                onClick={() => onNavigate('payroll')}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
                <CheckSquare className="w-4 h-4" /> Bordro Onayla
            </button>
            <button 
              onClick={() => onNavigate('recruitment')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Yeni İlan Aç
            </button>
        </div>
      </div>

      {/* --- KPI KARTLARI (GERÇEK VERİLER) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Personel</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.total}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Users className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-green-600 font-medium">{stats.active} aktif çalışan</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Açık Pozisyonlar</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{recruitmentStats.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Search className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Toplam 88 başvuru</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Deneme Süreci</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                 {loading ? '...' : stats.probation}
              </h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><Clock className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-orange-600 font-medium">takip gerekli</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Eksik Evrak</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.missingDocs}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600"><FileWarning className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-red-600 font-medium">aciliyet yüksek</p>
        </div>
      </div>

      {/* --- ALT TABLOLAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İşe Alım Tablosu */}
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
        </div>

        {/* Ajanda */}
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
        </div>
      </div>
    </div>
  );
}