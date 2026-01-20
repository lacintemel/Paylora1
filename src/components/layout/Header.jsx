import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  Bell, Search, Menu, Check, CheckCheck, ArrowRight 
} from 'lucide-react';

export default function Header({ currentUser, userRole, toggleSidebar, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // --- 1. BİLDİRİMLERİ GETİR & DİNLE ---
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();

      // Realtime: Yeni bildirim gelince anında göster
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${currentUser.id}` 
          }, 
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(subscription); };
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    // Son 20 bildirimi getir
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
        setNotifications(data);
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
    }
  };

  // --- 2. AKSİYONLAR ---

  // Tekil Bildirime Tıklama
  const handleNotificationClick = async (notif) => {
    // Okundu işaretle
    if (!notif.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Yönlendir
    if (notif.link && onNavigate) {
        // Link "/leave" gelirse "leave" yapıyoruz
        const targetPage = notif.link.startsWith('/') ? notif.link.substring(1) : notif.link;
        console.log("Header yönlendiriyor:", targetPage);
        onNavigate(targetPage);
        setShowDropdown(false);
    }
  };

  // Tümünü Okundu Say
  const markAllRead = async () => {
    if (unreadCount === 0) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);

    if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }
  };

  // Tümünü Gör Sayfasına Git
  const handleViewAll = () => {
      console.log("Tümünü gör butonuna basıldı. Hedef: notifications");
      if (onNavigate) {
          onNavigate('notifications');
          setShowDropdown(false);
      } else {
          console.error("HATA: onNavigate fonksiyonu Header'a ulaşmadı!");
      }
  };

  // --- 3. GÖRÜNÜM ---
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      
      {/* SOL: Menü Butonu & Arama */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all w-64">
           <Search className="w-4 h-4 text-gray-400" />
           <input type="text" placeholder="Panelde ara..." className="bg-transparent text-sm outline-none text-gray-700 w-full placeholder-gray-400"/>
        </div>
      </div>

      {/* SAĞ: Bildirimler & Profil */}
      <div className="flex items-center gap-6">
        
        {/* 🔔 BİLDİRİM KUTUSU */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>

          {showDropdown && (
            <>
              {/* Dışarı tıklayınca kapatmak için katman */}
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              
              {/* DROPDOWN MENÜSÜ */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 flex flex-col">
                 
                 {/* 1. ÜST BAŞLIK & OKUNDU BUTONU */}
                 <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 text-sm pl-2">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllRead} 
                            className="text-[10px] font-bold text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                            <CheckCheck className="w-3 h-3" /> Tümünü Okundu Say
                        </button>
                    )}
                 </div>
                 
                 {/* 2. BİLDİRİM LİSTESİ (Scroll edilebilir alan) */}
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                           Hiç bildirim yok. 🎉
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 border-b border-gray-50 transition-colors cursor-pointer group relative 
                                    ${notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-100'}`}
                            >
                                <div className="flex gap-3">
                                   {/* Mavi Nokta */}
                                   <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-blue-600'}`}></div>
                                   <div>
                                      <p className={`text-sm ${notif.is_read ? 'text-gray-600 font-medium' : 'text-gray-900 font-bold'}`}>
                                          {notif.title}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                      <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.created_at).toLocaleTimeString().slice(0,5)}</p>
                                   </div>
                                </div>
                                {notif.is_read && (
                                    <div className="absolute right-3 top-3 text-gray-300">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                 </div>

                 {/* 3. ALT BUTON: TÜMÜNÜ GÖR (Sabit) */}
                 <div className="p-3 bg-gray-50 border-t border-gray-100 text-center shrink-0 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleViewAll}>
                     <button className="text-xs font-bold text-gray-600 flex items-center justify-center gap-1 mx-auto w-full">
                         Tüm Bildirimleri Gör <ArrowRight className="w-3 h-3"/>
                     </button>
                 </div>

              </div>
            </>
          )}
        </div>

        {/* 👤 Profil */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
           <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ')}</p>
           </div>
           <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden">
              {currentUser?.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="avatar"/>
              ) : (
                  <span className="font-bold text-lg">{currentUser?.name?.charAt(0)}</span>
              )}
           </div>
        </div>

      </div>
    </header>
  );
}