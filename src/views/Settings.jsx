import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; 
import { 
  Building2, Save, Clock, User, Lock, Bell, CreditCard, 
  Camera, Upload, Loader2, Mail, CheckCircle, Download, AlertTriangle
} from 'lucide-react';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper';

export default function Settings({ userRole, currentUserId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null); 
  const logoInputRef = useRef(null);

  // --- STATE ---
  const [profileData, setProfileData] = useState({
    name: '', email: '', phone: '', position: '', avatar: null
  });

  const [companySettings, setCompanySettings] = useState({
    probation_months: 2, company_name: '', company_logo: ''
  });

  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    if (currentUserId) fetchProfile();
    // Herkes okuyabilir ama kaydetme yetkisi aşağıda kontrol edilir
    fetchCompanySettings(); 
  }, [currentUserId]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('employees').select('*').eq('id', currentUserId).single();
    if (data) setProfileData(data);
  };

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase.from('company_settings').select('*').maybeSingle();
      if (data) setCompanySettings(data);
    } catch (err) {
      console.error("Ayar çekme hatası:", err.message);
    }
  };

  // --- LOGO YÜKLEME (OTOMATİK VE ANINDA GÜNCELLEME) ---
  const handleLogoUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      // 1. Storage'a Yükle
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      // 2. URL Al
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // 3. Veritabanına ANINDA Yaz (Kaydet butonunu bekleme)
      const { error: dbError } = await supabase.from('company_settings').upsert({
         id: 1,
         company_logo: publicUrl,
         company_name: companySettings.company_name || 'PayMaki ',
         probation_months: companySettings.probation_months || 2
      });
      
      if (dbError) throw dbError;

      // 4. State güncelle ve App.jsx'i uyar (Sidebar değişsin)
      setCompanySettings(prev => ({ ...prev, company_logo: publicUrl }));
      if (onUpdate) onUpdate(); 

      alert("Logo güncellendi! Sol menüde görebilirsiniz. ✅");

    } catch (error) { 
      alert('Hata: ' + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  // --- PROFİL FOTO YÜKLEME ---
  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // State güncelle (Kayıt işlemi genel kaydet butonunda)
      setProfileData(prev => ({ ...prev, avatar: publicUrl }));
      alert("Fotoğraf yüklendi. Kalıcı olması için 'Kaydet' butonuna basın.");
    } catch (error) { alert('Hata: ' + error.message); } finally { setUploading(false); }
  };

  // --- ŞİFRE GÜNCELLEME ---
  const handlePasswordUpdate = async () => {
    if (!passwords.old || !passwords.new) return alert("Eski ve yeni şifre gerekli.");
    if (passwords.new !== passwords.confirm) return alert("Yeni şifreler uyuşmuyor.");
    
    setIsLoading(true);
    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profileData.email,
            password: passwords.old
        });
        if (signInError) throw new Error("Eski şifreniz hatalı!");

        const { error: updateError } = await supabase.auth.updateUser({ password: passwords.new });
        if (updateError) throw updateError;

        alert("Şifre güncellendi!");
        setPasswords({ old: '', new: '', confirm: '' });
    } catch (error) { alert(error.message); } finally { setIsLoading(false); }
  };

  // --- EMAIL GÜNCELLEME ---
  const handleEmailUpdate = async () => {
    if (!newEmail || !emailPassword) return alert("Yeni e-posta ve şifre gerekli.");

    setIsLoading(true);
    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profileData.email,
            password: emailPassword
        });
        if (signInError) throw new Error("Şifreniz hatalı!");

        const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
        if (updateError) throw updateError;

        alert("Doğrulama maili gönderildi!");
        setNewEmail(''); setEmailPassword('');
    } catch (error) { alert(error.message); } finally { setIsLoading(false); }
  };

  // --- GENEL KAYDETME ---
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 1. Profil
      await supabase.from('employees').update({
        name: profileData.name, phone: profileData.phone, avatar: profileData.avatar
      }).eq('id', currentUserId);

      // 2. Şirket (Sadece yetkililer)
      if (['general_manager', 'hr'].includes(userRole)) {
        await supabase.from('company_settings').upsert({
            id: 1, 
            probation_months: parseInt(companySettings.probation_months),
            company_name: companySettings.company_name,
            company_logo: companySettings.company_logo
        });
      }

      if (onUpdate) await onUpdate(); // Sidebar'ı güncelle
      alert('Kaydedildi! ✅');
    } catch (error) { alert('Hata: ' + error.message); } finally { setIsLoading(false); }
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
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Ayarlar</h1><p className="text-gray-500">Sistem yapılandırması.</p></div>
        <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm font-medium">
          {isLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4" />} Kaydet
        </button>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 rounded-t-xl scrollbar-hide">
        {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-b-xl border border-gray-100 min-h-[500px]">
        
        {/* PROFİL */}
        {activeTab === 'profile' && (
           <div className="max-w-4xl space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                 <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                   <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-400">
                    {isValidImageUrl(profileData.avatar)
                      ? <img src={profileData.avatar} className="w-full h-full object-cover" />
                      : getInitials(profileData.name)}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*"/>
                   <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700"><Camera className="w-4 h-4"/></button>
                </div>
                <div><h3 className="font-bold text-gray-800 text-lg">Profil Fotoğrafı</h3><p className="text-sm text-gray-500">Fotoğraf seçin ve kaydedin.</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Ad Soyad</label><input className="w-full border p-2.5 rounded-lg" value={profileData.name} onChange={e=>setProfileData({...profileData, name: e.target.value})}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Unvan</label><input disabled className="w-full border p-2.5 rounded-lg bg-gray-50 text-gray-500" value={profileData.position || ''}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Email</label><input disabled className="w-full border p-2.5 rounded-lg bg-gray-50 text-gray-500" value={profileData.email}/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Telefon</label><input className="w-full border p-2.5 rounded-lg" value={profileData.phone} onChange={e=>setProfileData({...profileData, phone: e.target.value})}/></div>
              </div>
           </div>
        )}

        {/* GÜVENLİK */}
        {activeTab === 'security' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4"/> Şifre Değiştir</h3>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Mevcut Şifre</label><input type="password" className="w-full border p-2 rounded" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Yeni Şifre</label><input type="password" className="w-full border p-2 rounded" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Yeni Şifre (Tekrar)</label><input type="password" className="w-full border p-2 rounded" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} /></div>
                 <button onClick={handlePasswordUpdate} disabled={isLoading} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold w-full hover:bg-gray-900">Şifreyi Güncelle</button>
              </div>

              <div className="space-y-4">
                 <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Mail className="w-4 h-4"/> E-posta Değiştir</h3>
                 <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">Email değişikliği için mevcut şifrenizi girmeniz gerekmektedir.</div>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Yeni E-posta Adresi</label><input type="email" className="w-full border p-2 rounded" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Mevcut Şifre (Onay için)</label><input type="password" className="w-full border p-2 rounded" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} /></div>
                 <button onClick={handleEmailUpdate} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold w-full hover:bg-blue-700">Değişiklik Onayı Gönder</button>
              </div>
           </div>
        )}

        {/* ŞİRKET AYARLARI */}
        {activeTab === 'company' && (
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Şirket Adı</label>
                  <input className="w-full border rounded-lg p-2.5" value={companySettings.company_name} onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}/>
                  <p className="text-xs text-gray-500 mt-1">Sidebar'da görünecek isim.</p>
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Deneme Süresi (Ay)</label>
                 <input type="number" className="w-full border rounded-lg p-2.5" value={companySettings.probation_months} onChange={(e) => setCompanySettings({...companySettings, probation_months: e.target.value})}/>
               </div>
               
               <div className="md:col-span-2 flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative">
                      {companySettings.company_logo ? 
                        <img src={companySettings.company_logo} className="w-full h-full object-contain" /> : 
                        <Building2 className="w-8 h-8 text-gray-400" />
                      }
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-800">Şirket Logosu</h3>
                      <button onClick={() => logoInputRef.current.click()} disabled={uploading} className="text-xs border border-gray-300 px-3 py-1.5 rounded bg-white hover:bg-gray-50 flex items-center gap-2 mt-2">
                        {uploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3" />} Logo Yükle
                      </button>
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*"/>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* BİLDİRİMLER */}
        {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-4">Bildirim Tercihleri</h2>
              <div className="space-y-4">
                {[{title: "Maaşlar", desc: "Ödeme yapıldığında bildirim al."}, {title: "İzinler", desc: "Yeni izin taleplerini bildir."}].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div><h4 className="font-bold text-gray-800 text-sm">{item.title}</h4><p className="text-xs text-gray-500">{item.desc}</p></div>
                    <input type="checkbox" defaultChecked className="accent-blue-600 w-4 h-4"/>
                  </div>
                ))}
              </div>
            </div>
        )}

        {/* FATURA */}
        {activeTab === 'billing' && (
           <div className="space-y-8">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-4">Plan ve Faturalandırma</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                    <CreditCard className="absolute top-4 right-4 text-gray-700 w-24 h-24 opacity-20"/>
                    <h3 className="text-2xl font-bold">Pro Plan</h3>
                    <p className="text-gray-400 text-sm mt-4">Sonraki yenileme: 12 Şubat 2026</p>
                  </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
}