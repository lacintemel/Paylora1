import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Megaphone, Plus, Trash2, ShieldAlert, 
  Info, Calendar, X, UserCircle
} from 'lucide-react';

export default function Announcements({ userRole, currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Yeni Duyuru Formu
  const [formData, setFormData] = useState({ title: '', content: '' });

  // Kimler duyuru atabilir?
  const canPost = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false }); // En yeni en üstte

    if (error) console.error(error);
    else setAnnouncements(data || []);
    setLoading(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    try {
        const { error } = await supabase.from('announcements').insert({
            title: formData.title,
            content: formData.content,
            author_name: currentUser?.name || 'Yönetici',
            author_role: userRole // 👈 Kritik nokta: Rolü kaydediyoruz
        });

        if (error) throw error;
        
        setIsModalOpen(false);
        setFormData({ title: '', content: '' });
        fetchAnnouncements(); // Listeyi yenile

    } catch (error) {
        alert("Hata: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu duyuruyu kaldırmak istediğinize emin misiniz?")) return;
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // --- RENK VE STİL AYARLAYICI ---
  const getCardStyle = (role) => {
      if (role === 'general_manager') {
          return {
              container: 'bg-red-50 border-red-200 shadow-red-100',
              icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
              badge: 'bg-red-600 text-white',
              title: 'text-red-900',
              roleText: 'GENEL YÖNETİM DUYURUSU'
          };
      } else {
          // HR veya Diğerleri
          return {
              container: 'bg-blue-50 border-blue-200 shadow-blue-100',
              icon: <Info className="w-5 h-5 text-blue-600" />,
              badge: 'bg-blue-600 text-white',
              title: 'text-blue-900',
              roleText: 'İK DUYURUSU'
          };
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <Megaphone className="w-6 h-6 text-orange-500" /> Şirket Duyuruları
            </h1>
            <p className="text-gray-500 text-sm mt-1">Önemli gelişmeler ve haberler.</p>
         </div>

         {/* Sadece Yetkililer "Ekle" Butonunu Görür */}
         {canPost && (
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
             >
                <Plus className="w-4 h-4" /> Duyuru Yap
             </button>
         )}
      </div>

      {/* DUYURU LİSTESİ */}
      <div className="space-y-4">
         {loading ? (
             <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
         ) : announcements.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 font-medium">Henüz bir duyuru yok.</p>
             </div>
         ) : (
             announcements.map((item) => {
                const style = getCardStyle(item.author_role);

                return (
                   <div key={item.id} className={`p-6 rounded-2xl border ${style.container} shadow-sm transition-all hover:shadow-md relative group`}>
                      
                      {/* Üst Kısım: Rozet ve Tarih */}
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 ${style.badge}`}>
                               {style.icon} {style.roleText}
                            </span>
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                               <Calendar className="w-3 h-3"/> {new Date(item.created_at).toLocaleDateString('tr-TR')}
                            </span>
                         </div>
                         
                         {/* Silme Butonu (Sadece Yetkili Görür) */}
                         {canPost && (
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 className="w-4 h-4"/>
                            </button>
                         )}
                      </div>

                      {/* İçerik */}
                      <h2 className={`text-xl font-bold mb-2 ${style.title}`}>{item.title}</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>

                      {/* Alt Kısım: Yazar */}
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2">
                         <UserCircle className="w-4 h-4 text-gray-400"/>
                         <span className="text-xs font-bold text-gray-500 uppercase">{item.author_name}</span>
                      </div>
                   </div>
                );
             })
         )}
      </div>

      {/* MODAL (YENİ DUYURU) */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-gray-800">Yeni Duyuru Oluştur</h3>
                   <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                </div>
                
                <form onSubmit={handlePost} className="p-6 space-y-4">
                   {/* Yönetici Uyarısı */}
                   <div className={`p-3 rounded-lg text-xs font-bold border ${userRole === 'general_manager' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {userRole === 'general_manager' 
                        ? '🚨 DİKKAT: Bu duyuru "GENEL YÖNETİM" etiketiyle kırmızı renkli ve acil olarak yayınlanacaktır.'
                        : 'ℹ️ BİLGİ: Bu duyuru "İK" etiketiyle standart mavi renkli olarak yayınlanacaktır.'}
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Başlık</label>
                      <input 
                         required 
                         className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="Örn: Ofis Tadilatı Hakkında"
                         value={formData.title}
                         onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">İçerik</label>
                      <textarea 
                         required 
                         rows="5"
                         className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                         placeholder="Duyuru detaylarını buraya yazın..."
                         value={formData.content}
                         onChange={e => setFormData({...formData, content: e.target.value})}
                      />
                   </div>

                   <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all">
                      Yayınla 🚀
                   </button>
                </form>
             </div>
         </div>
      )}

    </div>
  );
}