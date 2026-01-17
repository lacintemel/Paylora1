import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // 👈 SUPABASE BAĞLANTISI
import { 
  Users, 
  UserPlus, 
  FileWarning, 
  Calendar, 
  Search, 
  Clock, 
  Briefcase,
  CheckSquare
} from 'lucide-react';

export default function HRDashboard({ onNavigate }) {
  
  // --- STATE ---
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    probation: 0,   // Deneme Sürecindekiler
    candidates: 0,  // Toplam Başvuru/Aday
    openPositions: 0 // Benzersiz pozisyon sayısı
  });
  
  const [recruitmentList, setRecruitmentList] = useState([]); // Aday listesi (Tablo için)
  const [loading, setLoading] = useState(true);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // 1. ÇALIŞANLARI ÇEK
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');

      if (empError) throw empError;

      // 2. ADAYLARI ÇEK
      const { data: candidates, error: candError } = await supabase
        .from('candidates')
        .select('*');

      if (candError) throw candError;

      // --- HESAPLAMALAR ---
      
      // A) Aktif Çalışanlar (Sadece statüsü 'Active' olanlar)
      const activeCount = employees.filter(e => e.status === 'Active').length;
      const totalCount = activeCount;
      // B) Deneme Süreci (Sadece çalışanlar tablosunda olup, 6 aydan (180 gün) yeni başlayanlar)
      const probationCount = employees.filter(e => {
        if (!e.start_date) return false;
        const start = new Date(e.start_date);
        const today = new Date();
        const diffTime = Math.abs(today - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays < 180; 
      }).length;

      // C) İşe Alım İstatistikleri
      const uniqueRoles = [...new Set(candidates.map(c => c.role))].length; // Kaç farklı pozisyon var

      // State'i Güncelle
      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        probation: probationCount,
        candidates: candidates.length,
        openPositions: uniqueRoles
      });

      // Tablo için adayları kaydet (İlk 5 tanesi)
      setRecruitmentList(candidates.slice(0, 5));

    } catch (error) {
      console.error("Dashboard veri hatası:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Yaklaşan Olaylar (Şimdilik Statik Kalabilir veya ileride DB'den çekilebilir)
  const upcomingEvents = [
    { id: 1, title: 'Ali Yılmaz - Sözleşme Bitişi', date: '2 Gün Sonra', type: 'warning' },
    { id: 2, title: 'Şirket Yemeği', date: '15 Şubat', type: 'celebration' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İK Operasyon Merkezi</h1>
          <p className="text-gray-500">
            {loading ? 'Veriler güncelleniyor...' : 'Güncel şirket verileri ve işe alım özeti.'}
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onNavigate('leave')} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors">
                <Calendar className="w-4 h-4" /> Yıllık İzin
            </button>
            <button onClick={() => onNavigate('payroll')} className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors">
                <CheckSquare className="w-4 h-4" /> Bordro
            </button>
            <button onClick={() => onNavigate('recruitment')} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Yeni İlan / Aday
            </button>
        </div>
      </div>

      {/* --- KPI KARTLARI (CANLI VERİ) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Kart 1: Toplam Personel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Personel</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.totalEmployees}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Users className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-green-600 font-medium">
             {loading ? '...' : stats.activeEmployees} aktif çalışan
          </p>
        </div>

        {/* Kart 2: İşe Alım (Başvurular) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Başvuru</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : stats.candidates}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Search className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
             {stats.openPositions} farklı pozisyon için
          </p>
        </div>

        {/* Kart 3: Deneme Süreci */}
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
          <p className="mt-4 text-sm text-orange-600 font-medium">yeni başlayanlar</p>
        </div>

        {/* Kart 4: Eksik Evrak (Sabit/Mock) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Eksik Evrak</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">3</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600"><FileWarning className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-sm text-red-600 font-medium">aciliyet yüksek</p>
        </div>
      </div>

      {/* --- ALT TABLOLAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL: Son Başvurular Tablosu (Canlı Veri) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Son Eklenen Adaylar</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100 uppercase bg-gray-50">
                  <th className="py-3 px-4 font-medium rounded-l-lg">Aday İsmi</th>
                  <th className="py-3 px-4 font-medium">Pozisyon</th>
                  <th className="py-3 px-4 font-medium">Aşama</th>
                  <th className="py-3 px-4 font-medium text-right rounded-r-lg">İletişim</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recruitmentList.length > 0 ? (
                  recruitmentList.map((cand) => (
                    <tr key={cand.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-800">{cand.name}</td>
                      <td className="py-4 px-4 text-gray-600 flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {cand.role}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                          {cand.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-500 text-xs">
                        {cand.email}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      Henüz başvuru bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button 
              onClick={() => onNavigate('recruitment')}
              className="text-sm text-purple-600 font-medium hover:underline"
            >
              Tüm Adayları Yönet →
            </button>
          </div>
        </div>

        {/* SAĞ: Hatırlatıcılar */}
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
             <button onClick={() => onNavigate('payroll')} className="w-full bg-white text-purple-700 text-xs font-bold py-2 rounded border border-purple-200 hover:bg-purple-100 mb-2">
                Bordro Onayla
             </button>
             <button onClick={() => onNavigate('leave')} className="w-full bg-white text-purple-700 text-xs font-bold py-2 rounded border border-purple-200 hover:bg-purple-100">
                Yıllık İzin Planı
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}