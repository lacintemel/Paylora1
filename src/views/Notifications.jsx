import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Bell, Check, CheckCheck, Trash2, Filter, ArrowRight 
} from 'lucide-react';

export default function NotificationsPage({ currentUser, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' veya 'unread'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(100); // Çok şişmemesi için son 100 tanesi

    // Eğer filtre 'unread' ise sadece okunmamışları getir
    if (filter === 'unread') {
        query = query.eq('is_read', false);
    }

    const { data } = await query;
    setNotifications(data || []);
    setLoading(false);
  };

  const handleClick = async (notif) => {
    // Okundu işaretle
    if (!notif.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        // Listeyi güncelle (kırmızıdan beyaza dönsün)
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    // Yönlendir
    if (notif.link && onNavigate) {
        const targetPage = notif.link.startsWith('/') ? notif.link.substring(1) : notif.link;
        onNavigate(targetPage);
    }
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteAll = async () => {
    if(!confirm("Tüm bildirimleri silmek istediğinize emin misiniz?")) return;
    await supabase.from('notifications').delete().eq('user_id', currentUser.id);
    setNotifications([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <Bell className="w-6 h-6 text-blue-600" /> Bildirim Merkezi
            </h1>
            <p className="text-gray-500 text-sm mt-1">Tüm aktivitelerinizi buradan takip edebilirsiniz.</p>
         </div>

         <div className="flex items-center gap-3">
            {/* Filtre Butonları */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
               <button 
                 onClick={() => setFilter('all')}
                 className={`px-4 py-1.5 rounded-md transition-all ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Tümü
               </button>
               <button 
                 onClick={() => setFilter('unread')}
                 className={`px-4 py-1.5 rounded-md transition-all ${filter === 'unread' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Okunmamış
               </button>
            </div>
            
            {/* Toplu İşlemler */}
            <button onClick={markAllRead} title="Tümünü Okundu Say" className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-100 transition-colors">
               <CheckCheck className="w-5 h-5"/>
            </button>
            <button onClick={deleteAll} title="Tümünü Sil" className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-colors">
               <Trash2 className="w-5 h-5"/>
            </button>
         </div>
      </div>

      {/* BİLDİRİM LİSTESİ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         {loading ? (
             <div className="p-10 text-center text-gray-400">Yükleniyor...</div>
         ) : notifications.length === 0 ? (
             <div className="p-16 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                     <Bell className="w-8 h-8"/>
                 </div>
                 <h3 className="text-gray-800 font-bold">Her şey sessiz!</h3>
                 <p className="text-gray-500 text-sm mt-1">Şu an görüntülenecek bildiriminiz yok.</p>
             </div>
         ) : (
             <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                   <div 
                      key={notif.id} 
                      onClick={() => handleClick(notif)}
                      className={`p-5 flex items-start gap-4 transition-all cursor-pointer group hover:bg-gray-50
                        ${notif.is_read ? 'bg-white' : 'bg-blue-50/30'}`} // Okunmamışsa hafif mavi
                   >
                      {/* İkon */}
                      <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                         ${notif.is_read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                         {notif.is_read ? <Check className="w-5 h-5"/> : <Bell className="w-5 h-5"/>}
                      </div>

                      {/* İçerik */}
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <h3 className={`text-sm ${notif.is_read ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'}`}>
                                {notif.title}
                            </h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {new Date(notif.created_at).toLocaleString('tr-TR')}
                            </span>
                         </div>
                         <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                      </div>

                      {/* Sağ Ok (Hoverda çıkar) */}
                      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                         <ArrowRight className="w-5 h-5"/>
                      </div>
                   </div>
                ))}
             </div>
         )}
      </div>

    </div>
  );
}