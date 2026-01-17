import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; 
import { 
  Building2, Save, Clock, User, Lock, Bell, CreditCard, 
  Camera, ShieldAlert, Upload, Loader2, CheckCircle, Download,
  AlertTriangle, Mail
} from 'lucide-react';

export default function Settings({ userRole, currentUserId, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- STATE ---
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    avatar: null
  });

  const [companySettings, setCompanySettings] = useState({
    probation_months: 3,
    company_name: '',
  });

  // --- HELPER: Baş Harfler ---
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    if (currentUserId) fetchProfile();
    if (['general_manager', 'hr'].includes(userRole)) fetchCompanySettings();
  }, [currentUserId, userRole]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', currentUserId)
        .single();
      if (error) throw error;
      if (data) setProfileData(data);
    } catch (error) {
      console.error("Profil verisi çekilemedi:", error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const { data } = await supabase.from('company_settings').select('*').single();
      if (data) setCompanySettings(data);
    } catch (error) {
      console.error("Şirket ayarları çekilemedi:", error);
    }
  };

  // --- 2. FOTOĞRAF YÜKLEME ---
  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
            throw new Error("Supabase panelinde 'avatars' adında Public Bucket yok!");
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, avatar: publicUrl }));
      alert("Fotoğraf başarıyla yüklendi! Kaydet butonuna basmayı unutmayın.");

    } catch (error) {
      alert('Yükleme hatası: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 3. KAYDETME ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Profil Güncelle
      const { error: profileError } = await supabase
        .from('employees')
        .update({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          avatar: profileData.avatar
        })
        .eq('id', currentUserId);

      if (profileError) throw profileError;

      // Şirket Ayarları
      if (activeTab === 'company' && ['general_manager', 'hr'].includes(userRole)) {
        const { error: companyError } = await supabase
          .from('company_settings')
          .update({ 
            probation_months: companySettings.probation_months,
            company_name: companySettings.company_name
          })
          .eq('id', 1);

        if (companyError) throw companyError;
      }
      
      // ✅ KRİTİK NOKTA: App.jsx'e haber veriyoruz
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
      
      alert('Tüm değişiklikler başarıyla kaydedildi! ✅');

    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- TABS ---
  const tabs = [
    { id: 'profile', label: 'Profilim', icon: User },
    { id: 'security', label: 'Güvenlik', icon: Lock },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ];
  if (['general_manager', 'hr'].includes(userRole)) tabs.push({ id: 'company', label: 'Şirket Ayarları', icon: Building2 });
  if (userRole === 'general_manager') tabs.push({ id: 'billing', label: 'Plan & Ödeme', icon: CreditCard });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
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
          {isLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4" />} Kaydet
        </button>
      </div>

      {/* TAB MENU */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 rounded-t-xl scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* İÇERİK */}
      <div className="bg-white p-8 rounded-b-xl border border-gray-100 min-h-[600px]">
        
        {/* --- 1. PROFİL --- */}
        {activeTab === 'profile' && (
           <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                <div className="relative group cursor-pointer">
                  {/* Avatar Mantığı */}
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                     {profileData.avatar ? (
                       <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <span>{getInitials(profileData.name)}</span>
                     )}
                  </div>
                  <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*"/>
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 text-lg">Profil Fotoğrafı</h3>
                   <p className="text-sm text-gray-500 mb-3">JPG, PNG formatında (Max 2MB).</p>
                   <button disabled={uploading} onClick={() => fileInputRef.current.click()} className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-2">
                     {uploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                     {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Ad Soyad</label><input type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.name} onChange={e=>setProfileData({...profileData, name: e.target.value})}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Unvan</label><input type="text" disabled className="w-full border p-2.5 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" value={profileData.position || ''}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label><input type="email" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.email} onChange={e=>setProfileData({...profileData, email: e.target.value})}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Telefon</label><input type="tel" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={profileData.phone} onChange={e=>setProfileData({...profileData, phone: e.target.value})}/></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Hakkımda</label><textarea rows="3" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Kısa bir biyografi..."></textarea></div>
           </div>
        )}

        {/* --- 2. GÜVENLİK --- */}
        {activeTab === 'security' && (
           <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Şifre Değiştir</h3>
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200 flex items-start gap-3">
                 <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                 <div><span className="font-bold">Bilgi:</span> Güvenlik ayarları demo modundadır.</div>
              </div>
              <div className="space-y-4">
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Mevcut Şifre</label><input type="password" placeholder="••••••••" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">Yeni Şifre</label><input type="password" placeholder="••••••••" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3 mt-6">
                 <ShieldAlert className="w-6 h-6 text-orange-600 flex-shrink-0" />
                 <div>
                    <h4 className="font-bold text-orange-800 text-sm">İki Faktörlü Doğrulama (2FA)</h4>
                    <p className="text-xs text-orange-700 mt-1">Hesabınızı daha güvenli hale getirmek için aktifleştirin.</p>
                    <button className="mt-2 text-xs font-bold text-orange-700 bg-white border border-orange-200 px-3 py-1 rounded hover:bg-orange-100 transition-colors">Aktifleştir</button>
                 </div>
              </div>
           </div>
        )}

        {/* --- 3. BİLDİRİMLER --- */}
        {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-4">Bildirim Tercihleri</h2>
              <div className="space-y-4">
                {[
                  { title: "Maaş Ödemeleri", desc: "Maaşlar yattığında bildir.", icon: CreditCard },
                  { title: "Yeni Başvurular", desc: "Yeni aday eklendiğinde bildir.", icon: User },
                  { title: "İzin Talepleri", desc: "Personel izin talep ettiğinde bildir.", icon: Clock },
                  { title: "Sistem Uyarıları", desc: "Bakım ve güncellemelerde bildir.", icon: AlertTriangle }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg"><item.icon className="w-5 h-5 text-gray-500"/></div>
                        <div><h4 className="font-bold text-gray-800 text-sm">{item.title}</h4><p className="text-xs text-gray-500">{item.desc}</p></div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600 transition-all"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
        )}

        {/* --- 4. ŞİRKET AYARLARI --- */}
        {activeTab === 'company' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-4">Şirket Yapılandırması</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-24 h-24 text-blue-600"/></div>
                 <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2 relative z-10"><Clock className="w-4 h-4"/> Deneme Süreci Uzunluğu</label>
                 <div className="flex items-center gap-3 relative z-10">
                    <input type="number" min="1" max="12" className="w-24 border border-blue-200 rounded-lg p-2.5 text-center font-bold" value={companySettings.probation_months} onChange={(e) => setCompanySettings({...companySettings, probation_months: e.target.value})}/>
                    <span className="font-bold text-gray-700">Ay</span>
                 </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Şirket Adı</label><input className="w-full border rounded-lg p-2.5" value={companySettings.company_name} onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}/></div>
              <div className="md:col-span-2 flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"><Building2 className="w-8 h-8 text-gray-400" /></div>
                  <div><h3 className="font-bold text-gray-800">Şirket Logosu</h3><button className="text-sm border border-gray-300 px-3 py-1.5 rounded bg-white hover:bg-gray-50 flex items-center gap-2 mt-2"><Upload className="w-3 h-3" /> Değiştir</button></div>
              </div>
            </div>
          </div>
        )}

        {/* --- 5. FATURALANDIRMA --- */}
        {activeTab === 'billing' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-4">Plan ve Faturalandırma</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kart */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard className="w-32 h-32 text-white"/></div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-sm font-medium mb-1">Mevcut Plan</p>
                        <h3 className="text-3xl font-bold flex items-center gap-3">Pro Plan <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Aktif</span></h3>
                        <p className="text-gray-400 text-sm mt-4">Sonraki yenileme: 12 Şubat 2026</p>
                    </div>
                  </div>
                  {/* Ödeme Yöntemi */}
                  <div className="border border-gray-200 rounded-xl p-6 flex flex-col justify-between bg-gray-50/50">
                     <div>
                        <h4 className="font-bold text-gray-800 mb-4">Ödeme Yöntemi</h4>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                            <div className="w-12 h-8 bg-[#1a1f71] rounded flex items-center justify-center text-white text-xs font-bold italic">VISA</div>
                            <div><p className="font-bold text-gray-800">Visa •••• 4242</p><p className="text-xs text-gray-500">12/28</p></div>
                            <CheckCircle className="w-5 h-5 text-green-500 ml-auto"/>
                        </div>
                     </div>
                     <button className="w-full mt-4 text-blue-600 font-bold text-sm border border-blue-200 bg-white py-2 rounded-lg hover:bg-blue-50">Kartı Güncelle</button>
                  </div>
              </div>
              
              {/* Fatura Tablosu */}
              <div>
                  <h3 className="font-bold text-gray-800 mb-4 mt-4">Fatura Geçmişi</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                              <tr><th className="px-6 py-3 font-medium">Tarih</th><th className="px-6 py-3 font-medium">Tutar</th><th className="px-6 py-3 font-medium">Durum</th><th className="px-6 py-3 font-medium text-right">İndir</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {[
                                  { date: '12 Oca 2026', amount: '$29.00', status: 'Paid' },
                                  { date: '12 Ara 2025', amount: '$29.00', status: 'Paid' },
                              ].map((inv, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 font-medium text-gray-700">{inv.date}</td>
                                      <td className="px-6 py-4 text-gray-600">{inv.amount}</td>
                                      <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Ödendi</span></td>
                                      <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-blue-600"><Download className="w-4 h-4"/></button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}