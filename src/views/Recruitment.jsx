import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  Plus, MoreHorizontal, Mail, Phone, Calendar, 
  X, CheckCircle, DollarSign, Briefcase, UserPlus 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const STAGES = [
  { id: 'Applied', label: 'Başvuru', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Screening', label: 'İnceleniyor', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Interview', label: 'Görüşülüyor', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Offer', label: 'Teklif', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'Hired', label: 'İşe Alındı', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'Rejected', label: 'Reddedildi', color: 'bg-red-50 text-red-700 border-red-200' }
];

export default function Recruitment() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState(null);

  // Form (Departman Eklendi)
  const [formData, setFormData] = useState({ 
    name: '', position: '', email: '', phone: '', department: 'Engineering' 
  });

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
    if (!error) setCandidates(data || []);
    setLoading(false);
  };

  // --- TÜRKÇE KARAKTER TEMİZLEYİCİ (Email/Şifre İçin) ---
  const normalizeTr = (text) => {
    return text
      .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .toLowerCase().replace(/\s/g, '');
  };

  // --- 🔥 OTOMATİK İŞE ALIM FONKSİYONU ---
  const hireCandidate = async (candidate) => {
    if (!window.confirm(`${candidate.name} isimli adayı işe almak ve personel kaydını oluşturmak istiyor musunuz?`)) {
        fetchCandidates(); // İptal ederse listeyi eski haline getir
        return;
    }

try {
        // 1. İsim Ayrıştırma ve Şifre Oluşturma
        const nameParts = candidate.name.trim().split(' ');
        const firstName = nameParts[0].toLowerCase(); 
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : 'personel';
        
        // Türkçe karakterleri temizle (normalize)
        const normalizeTr = (text) => text.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
        
        const prefix = normalizeTr(firstName.substring(0, 2) + lastName);
        const companyEmail = `${prefix}@paymaki.com`;
        const tempPassword = `${prefix}123`; 

        // ----------------------------------------------------------------
        // 🛠️ KRİTİK ADIM: GEÇİCİ CLIENT OLUŞTURMA
        // Bu client, senin oturumunu kapatmadan yeni kullanıcı oluşturur.
        // ----------------------------------------------------------------
        const tempSupabase = createClient(
            supabase.supabaseUrl, 
            supabase.supabaseKey, 
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false, // 👈 SENİN OTURUMUNU BOZMAZ
                    detectSessionInUrl: false
                }
            }
        );

        // 2. AUTH SİSTEMİNE KAYIT ET (Kapı Kartını Ver)
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: companyEmail,
            password: tempPassword,
            options: {
                data: { 
                    full_name: candidate.name,
                    avatar_url: firstName.substring(0,2).toUpperCase()
                }
            }
        });

        if (authError) throw new Error("Auth Kayıt Hatası: " + authError.message);
        if (!authData.user) throw new Error("Kullanıcı oluşturulamadı.");

        // 3. EMPLOYEES TABLOSUNA EKLE (Personel Dosyasını Aç)
        // ⚠️ DİKKAT: 'id' olarak authData.user.id kullanıyoruz ki eşleşsinler!
        const { error: empError } = await supabase.from('employees').insert({
            id: authData.user.id,     // 👈 ARTIK BU ID AUTH İLE AYNI!
            name: candidate.name,
            email: companyEmail,      
            personal_email: candidate.email,
            phone: candidate.phone,
            department: candidate.department || 'Engineering', 
            position: candidate.position,
            salary: candidate.offer_salary || 0,
            status: 'Active',
            avatar: firstName.substring(0,2).toUpperCase(),
            start_date: new Date().toISOString().split('T')[0],
            is_first_login: true,
            company_email: companyEmail
        });

        if (empError) {
            // Eğer employees tablosuna eklerken hata olursa, açtığımız Auth kullanıcısını temizleyelim (Opsiyonel ama temizlik iyidir)
            // await supabase.auth.admin.deleteUser(authData.user.id); // (Sadece service_role ile çalışır, burayı geçiyorum)
            throw empError;
        }

        // 4. Adayın Statüsünü 'Hired' Yap
        await supabase.from('candidates').update({ stage: 'Hired' }).eq('id', candidate.id);

        alert(`✅ PERSONEL BAŞARIYLA OLUŞTURULDU!\n\n📧 Email: ${companyEmail}\n🔑 Şifre: ${tempPassword}\n\nLütfen bu bilgileri personele iletin.`);
        
        // Listeyi yenile (eğer fetchCandidates fonksiyonun props olarak geliyorsa veya bu dosyadaysa)
        if(typeof fetchCandidates === 'function') fetchCandidates();

    } catch (error) {
        console.error("Hata:", error);
        alert("İşe alım sırasında hata: " + error.message);
    }
};
  // --- SÜRÜKLE & BIRAK MANTIĞI ---
  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedCandidate(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedCandidate) return;

    // KENDİ SÜTUNUNA BIRAKIRSA İŞLEM YAPMA
    if (draggedCandidate.stage === targetStage) return;

    // --- SENARYO 1: TEKLİF AŞAMASI (MAAŞ GİRME) ---
    if (targetStage === 'Offer') {
        const input = prompt("Bu aday için teklif edilen NET maaş nedir?", "0");
        if (input === null) return; // İptal
        
        const salary = parseInt(input);
        
        // Veritabanını Güncelle
        await supabase.from('candidates').update({ stage: 'Offer', offer_salary: salary }).eq('id', draggedCandidate.id);
        fetchCandidates(); // Listeyi yenile
        return;
    }

    // --- SENARYO 2: İŞE ALIM AŞAMASI (PERSONEL OLUŞTURMA) ---
    if (targetStage === 'Hired') {
        // Otomasyon fonksiyonunu çağır
        await hireCandidate(draggedCandidate);
        return;
    }

    // --- SENARYO 3: NORMAL GÜNCELLEME ---
    // Önce arayüzü güncelle (Hız için)
    const updatedList = candidates.map(c => c.id === draggedCandidate.id ? { ...c, stage: targetStage } : c);
    setCandidates(updatedList);

    // Sonra veritabanına yaz
    const { error } = await supabase.from('candidates').update({ stage: targetStage }).eq('id', draggedCandidate.id);
    if (error) {
       alert("Güncelleme başarısız!");
       fetchCandidates();
    }
  };

  // --- YENİ ADAY EKLEME ---
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('candidates').insert([{ ...formData, stage: 'Applied' }]);
    if (!error) {
        setIsModalOpen(false);
        setFormData({ name: '', position: '', email: '', phone: '', department: 'Engineering' });
        fetchCandidates();
    } else {
        alert("Hata: " + error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İşe Alım Panosu</h1>
          <p className="text-gray-500">Adayları sürükleyerek işe alım sürecini yönetin.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm font-bold">
           <UserPlus className="w-4 h-4"/> Yeni Aday
        </button>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
         <div className="flex gap-6 min-w-max h-full px-1">
            {STAGES.map(stage => {
                const stageCandidates = candidates.filter(c => c.stage === stage.id);
                return (
                   <div 
                     key={stage.id} 
                     className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200 h-full max-h-[calc(100vh-180px)]"
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, stage.id)}
                   >
                      {/* Sütun Başlığı */}
                      <div className={`p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10`}>
                         <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${stage.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                            <h3 className="font-bold text-gray-700">{stage.label}</h3>
                         </div>
                         <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{stageCandidates.length}</span>
                      </div>

                      {/* Kartlar */}
                      <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                         {stageCandidates.map(candidate => (
                            <div 
                               key={candidate.id}
                               draggable
                               onDragStart={(e) => handleDragStart(e, candidate)}
                               onDragEnd={handleDragEnd}
                               className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative"
                            >
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-bold text-gray-800">{candidate.name}</h4>
                                    <p className="text-sm text-blue-600 font-medium">{candidate.position}</p>
                                  </div>
                                  <div className="bg-gray-100 p-1 rounded">
                                    <Briefcase className="w-3 h-3 text-gray-500"/>
                                  </div>
                               </div>
                               
                               <div className="space-y-1.5 mt-3">
                                  <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3 h-3" /> {candidate.email}</div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3 h-3" /> {candidate.phone || '-'}</div>
                                  
                                  {/* Maaş Teklifi Varsa Göster */}
                                  {candidate.offer_salary > 0 && (
                                     <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit mt-1">
                                        <DollarSign className="w-3 h-3"/> Teklif: ${candidate.offer_salary}
                                     </div>
                                  )}

                                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50 mt-2">
                                     <Calendar className="w-3 h-3" /> {new Date(candidate.created_at).toLocaleDateString('tr-TR')}
                                  </div>
                               </div>
                            </div>
                         ))}
                         {stageCandidates.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg opacity-50"><p className="text-sm text-gray-400">Aday yok</p></div>
                         )}
                      </div>
                   </div>
                );
            })}
         </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-xl font-bold text-gray-800">Yeni Aday Ekle</h2>
                 <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-500"/></button>
              </div>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                 <div><label className="text-sm font-bold text-gray-700">Ad Soyad</label><input required className="w-full border p-2 rounded-lg mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                 <div><label className="text-sm font-bold text-gray-700">Pozisyon</label><input required className="w-full border p-2 rounded-lg mt-1" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
                 
                 {/* DEPARTMAN SEÇİMİ EKLENDİ */}
                 <div>
                    <label className="text-sm font-bold text-gray-700">Departman</label>
                    <select className="w-full border p-2 rounded-lg mt-1 bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                        {['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Product'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-bold text-gray-700">Email</label><input required type="email" className="w-full border p-2 rounded-lg mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    <div><label className="text-sm font-bold text-gray-700">Telefon</label><input className="w-full border p-2 rounded-lg mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                 </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-600">İptal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Kaydet</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}