import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Megaphone, Plus, Trash2, Calendar, 
  ShieldAlert, Info, X, UserCircle 
} from 'lucide-react';

export default function DashboardAnnouncements({ userRole, currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const canPost = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5); // Sadece son 5 duyuruyu gösterelim
    setAnnouncements(data || []);
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
            author_role: userRole
        });
        if (error) throw error;
        setIsModalOpen(false);
        setFormData({ title: '', content: '' });
        fetchAnnouncements();
    } catch (error) { alert(error.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Silmek istiyor musunuz?")) return;
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const getStyle = (role) => role === 'general_manager' 
    ? { bg: 'bg-red-50', border: 'border-red-100', icon: <ShieldAlert className="w-4 h-4 text-red-600"/>, text: 'text-red-800', badge: 'bg-red-100 text-red-700' }
    : { bg: 'bg-blue-50', border: 'border-blue-100', icon: <Info className="w-4 h-4 text-blue-600"/>, text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
       
       {/* HEADER */}
       <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
             <Megaphone className="w-5 h-5 text-orange-500" /> Şirket Duyuruları
          </h3>
          {canPost && (
              <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 flex items-center gap-1 transition-all">
                 <Plus className="w-3 h-3"/> Yeni Ekle
              </button>
          )}
       </div>

       {/* LİSTE */}
       <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          {loading ? <p className="text-center text-gray-400 text-sm">Yükleniyor...</p> : 
           announcements.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">Henüz duyuru yok.</div>
           ) : (
             announcements.map((item) => {
                const style = getStyle(item.author_role);
                return (
                   <div key={item.id} className={`p-4 rounded-xl border ${style.bg} ${style.border} relative group transition-all hover:shadow-sm`}>
                      <div className="flex justify-between items-start mb-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide ${style.badge}`}>
                            {style.icon} {item.author_role === 'general_manager' ? 'YÖNETİM' : 'İK'}
                         </span>
                         <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3"/> {new Date(item.created_at).toLocaleDateString('tr-TR')}
                         </span>
                      </div>
                      
                      <h4 className={`font-bold text-sm mb-1 ${style.text}`}>{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>

                      <div className="mt-3 pt-3 border-t border-black/5 flex justify-between items-center">
                         <div className="flex items-center gap-1.5">
                            <UserCircle className="w-3 h-3 text-gray-400"/>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{item.author_name}</span>
                         </div>
                         {canPost && (
                            <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                               <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                         )}
                      </div>
                   </div>
                );
             })
           )
          }
       </div>

       {/* MODAL */}
       {isModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <h3 className="font-bold text-gray-800">Duyuru Yayınla</h3>
                   <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <form onSubmit={handlePost} className="p-5 space-y-4">
                   <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Başlık</label>
                      <input required className="w-full border rounded-lg p-2 text-sm" placeholder="Örn: Cuma Günü Hakkında" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">İçerik</label>
                      <textarea required rows="4" className="w-full border rounded-lg p-2 text-sm resize-none" placeholder="Mesajınız..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/>
                   </div>
                   <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700">Yayınla</button>
                </form>
             </div>
         </div>
       )}
    </div>
  );
}