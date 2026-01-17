import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  Shield, 
  CreditCard, 
  Save, 
  Upload,
  Clock,
  User,
  Lock,
  Camera
} from 'lucide-react';

// 👇 userRole prop'unu App.jsx'ten alıyoruz
export default function Settings({ userRole }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. KİŞİSEL AYARLAR STATE ---
  const [profileData, setProfileData] = useState({
    name: 'Laci Temel',
    email: 'laci@paylora.com',
    phone: '+90 555 123 4567',
    bio: 'General Manager'
  });

  // --- 2. ŞİRKET AYARLARI STATE (Senin kodun) ---
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Paylora Teknoloji A.Ş.',
    email: 'info@paylora.com',
    address: 'Maslak Mah. Büyükdere Cad. No:1, İstanbul',
    currency: 'USD ($)'
  });

  const [workSettings, setWorkSettings] = useState({
    startHour: '09:00',
    endHour: '18:00',
    weekends: 'Cumartesi - Pazar'
  });

  // Kaydetme Simülasyonu
  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Değişiklikler başarıyla kaydedildi! ✅');
    }, 1000);
  };

  // --- SEKME YAPILANDIRMASI ---
  // Herkesin görebileceği sekmeler
  const tabs = [
    { id: 'profile', label: 'Profilim', icon: User },
    { id: 'security', label: 'Güvenlik', icon: Lock },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ];

  // Sadece YÖNETİCİLERİN (GM ve HR) görebileceği sekmeler
  if (['general_manager', 'hr'].includes(userRole)) {
    tabs.push(
      { id: 'company', label: 'Şirket Bilgileri', icon: Building2 },
      { id: 'working', label: 'Mesai Ayarları', icon: Clock }
    );
  }
  // Sadece GENERAL MANAGER görebileceği sekmeler
  if (userRole === 'general_manager') {
    tabs.push(
       { id: 'billing', label: 'Plan & Ödeme', icon: CreditCard }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* --- BAŞLIK --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ayarlar</h1>
          <p className="text-gray-500">Profilinizi ve sistem yapılandırmasını yönetin.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 font-medium"
        >
          {isLoading ? (
            <span className="animate-pulse">Kaydediliyor...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Kaydet
            </>
          )}
        </button>
      </div>

      {/* --- SEKMELER (Dinamik) --- */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 rounded-t-xl scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- İÇERİK ALANI --- */}
      <div className="bg-white p-8 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 min-h-[500px]">
        
        {/* 1. PROFİLİM (Herkes Görür) */}
        {activeTab === 'profile' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
              {/* Profil Fotoğrafı */}
              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">
                     {/* Simüle edilmiş avatar */}
                     LT
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 text-lg">Profil Fotoğrafı</h3>
                   <p className="text-sm text-gray-500 mb-3">.jpg veya .png formatında yükleyiniz.</p>
                   <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">Yükle</button>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Ad Soyad</label><input type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.name} onChange={e=>setProfileData({...profileData, name: e.target.value})}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Unvan</label><input type="text" disabled className="w-full border p-2.5 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" value={profileData.bio}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label><input type="email" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.email} onChange={e=>setProfileData({...profileData, email: e.target.value})}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Telefon</label><input type="tel" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.phone} onChange={e=>setProfileData({...profileData, phone: e.target.value})}/></div>
              </div>
           </div>
        )}

        {/* 2. GÜVENLİK (Herkes Görür) */}
        {activeTab === 'security' && (
           <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Şifre Değiştir</h3>
              <div className="space-y-4">
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Mevcut Şifre</label><input type="password" placeholder="••••••••" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Yeni Şifre</label><input type="password" placeholder="••••••••" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Yeni Şifre (Tekrar)</label><input type="password" placeholder="••••••••" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 mt-6">
                 <Shield className="w-6 h-6 text-orange-600 flex-shrink-0" />
                 <div>
                    <h4 className="font-bold text-orange-800 text-sm">İki Faktörlü Doğrulama (2FA)</h4>
                    <p className="text-xs text-orange-700 mt-1">Hesabınızı daha güvenli hale getirmek için aktifleştirin.</p>
                    <button className="mt-2 text-xs font-bold text-orange-700 bg-white border border-orange-200 px-3 py-1 rounded hover:bg-orange-100">Aktifleştir</button>
                 </div>
              </div>
           </div>
        )}

        {/* 3. ŞİRKET AYARLARI (Sadece GM/HR) */}
        {activeTab === 'company' && (
          <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Şirket Logosu</h3>
                <p className="text-sm text-gray-500 mb-2">Raporlarda ve giriş ekranında görünür.</p>
                <button className="text-sm border border-gray-300 px-3 py-1.5 rounded bg-white hover:bg-gray-50 flex items-center gap-2"><Upload className="w-3 h-3" /> Değiştir</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Şirket Adı</label><input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={companyInfo.name} onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Resmi Email</label><input type="email" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={companyInfo.email} onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}/></div>
              <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Adres</label><input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={companyInfo.address} onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Para Birimi</label><select className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={companyInfo.currency} onChange={(e) => setCompanyInfo({...companyInfo, currency: e.target.value})}><option>USD ($)</option><option>EUR (€)</option><option>TRY (₺)</option></select></div>
            </div>
          </div>
        )}

        {/* 4. MESAİ AYARLARI (Sadece GM/HR) */}
        {activeTab === 'working' && (
          <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2">
             <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-6 border border-blue-100">
               <span className="font-bold">Bilgi:</span> Bu ayarlar "Zaman Takibi" modülündeki mesai hesaplamalarını doğrudan etkiler.
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Başlangıç Saati</label><input type="time" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={workSettings.startHour} onChange={(e) => setWorkSettings({...workSettings, startHour: e.target.value})}/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Bitiş Saati</label><input type="time" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" value={workSettings.endHour} onChange={(e) => setWorkSettings({...workSettings, endHour: e.target.value})}/></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Hafta Sonu Tatili</label><select className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={workSettings.weekends} onChange={(e) => setWorkSettings({...workSettings, weekends: e.target.value})}><option>Cumartesi - Pazar</option><option>Sadece Pazar</option><option>Cuma - Cumartesi</option></select></div>
          </div>
        )}

        {/* Placeholder Sekmeler */}
        {(activeTab === 'notifications' || activeTab === 'billing') && (
           <div className="text-center py-20 text-gray-400">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-gray-600">Bu modül yakında aktif olacak</h3>
              <p>Backend entegrasyonu tamamlandığında buradan yönetebileceksiniz.</p>
           </div>
        )}

      </div>
    </div>
  );
}