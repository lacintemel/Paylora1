import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Download, 
  Sun, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronRight // EKLENDİ
} from 'lucide-react';

export default function EmployeeDashboard({ onNavigate }){
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [workDuration, setWorkDuration] = useState(0); 
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (isClockedIn) {
      interval = setInterval(() => {
        setWorkDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const leaveBalance = 14;
  const nextHoliday = "23 Nisan - Ulusal Egemenlik";
  const lastSalary = 8229.17; 
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- ÜST KISIM: HOŞGELDİN KARTI --- */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-100 mb-1">
              <Sun className="w-5 h-5" />
              <span className="font-medium">Günaydın, Laci</span>
            </div>
            <h1 className="text-3xl font-bold">Bugün harika işler çıkaracağına eminiz! 🚀</h1>
            <p className="mt-2 text-green-100 opacity-90">
              Bugün ofiste 4 toplantın var. Bir sonraki toplantı 14:00'te.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center min-w-[200px]">
            <p className="text-sm font-medium text-green-100 mb-2">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="text-2xl font-mono font-bold mb-4">
              {formatDuration(workDuration)}
            </div>
            <button 
              onClick={() => setIsClockedIn(!isClockedIn)}
              className={`w-full py-2 px-4 rounded-lg font-bold transition-all shadow-lg ${
                isClockedIn 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-white text-green-700 hover:bg-green-50'
              }`}
            >
              {isClockedIn ? 'Paydos Yap 🛑' : 'Mesaiye Başla ▶'}
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
      </div>

      {/* --- KPI KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* İzin Kartı (DÜZELTİLDİ: onClick prop olarak eklendi) */}
        <div 
            onClick={() => onNavigate('leave')} // BURASI DÜZELTİLDİ
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors cursor-pointer group"
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Kalan İzin Hakkı</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{leaveBalance} Gün</h3>
            <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                İzin Talep Et <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-full text-orange-500">
            <Briefcase className="w-8 h-8" />
          </div>
        </div>

        {/* Tatil Kartı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Sıradaki Tatil</p>
            <h3 className="text-lg font-bold text-gray-800 mt-1">{nextHoliday}</h3>
            <p className="text-xs text-gray-400 mt-2">34 Gün kaldı</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-full text-blue-500">
            <Calendar className="w-8 h-8" />
          </div>
        </div>

        {/* Maaş Kartı (DÜZELTİLDİ: onClick prop olarak eklendi) */}
        <div 
            onClick={() => onNavigate('documents')} // BURASI DÜZELTİLDİ
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors cursor-pointer group"
        >
          <div>
            <p className="text-sm font-medium text-gray-500">Son Yatan Maaş</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">${lastSalary.toLocaleString()}</h3>
            <p className="flex items-center gap-1 text-xs text-green-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <Download className="w-3 h-3" /> Bordroyu İndir
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-full text-green-500">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

      </div>

      {/* --- ALT BÖLÜM: SON HAREKETLER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Bu Haftaki Mesailer</h3>
          <div className="space-y-3">
            {[
              { day: 'Dün', date: '16 Oca', in: '09:00', out: '18:00', total: '9s', status: 'Tamamlandı' },
              { day: 'Çarşamba', date: '15 Oca', in: '09:15', out: '18:15', total: '9s', status: 'Tamamlandı' },
              { day: 'Salı', date: '14 Oca', in: '08:50', out: '17:50', total: '9s', status: 'Tamamlandı' },
            ].map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 text-sm">{log.day}</p>
                    <p className="text-xs text-gray-500">{log.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{log.in} - {log.out}</p>
                  <p className="text-xs text-green-600">{log.total} • {log.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Şirket Duyuruları</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800">Yıllık Zam Oranları Hakkında</p>
                <p className="text-sm text-gray-600 mt-1">Yönetim kurulumuz 2026 zam oranlarını belirlemek üzere toplanmıştır. Sonuçlar Cuma günü açıklanacaktır.</p>
                <p className="text-xs text-gray-400 mt-2">2 saat önce</p>
              </div>
            </div>
            <div className="w-full h-px bg-gray-100"></div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800">Ofis İlaçlaması</p>
                <p className="text-sm text-gray-600 mt-1">Bu hafta sonu ofiste genel ilaçlama yapılacaktır. Lütfen masalarınızda yiyecek bırakmayınız.</p>
                <p className="text-xs text-gray-400 mt-2">Dün</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}