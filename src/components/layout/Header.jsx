import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase'; // Yolun doğru olduğundan emin ol
import { 
  Bell, Settings, LogOut, User, ChevronDown, 
  PanelLeftClose, PanelLeftOpen, Check, Trash2 
} from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, currentUser, userRole, onNavigate, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // --- BİLDİRİM STATE'LERİ ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // --- 1. BAŞLANGIÇ VE CANLI TAKİP ---
  useEffect(() => {
    fetchNotifications();

    // CANLI DİNLEME (Real-time)
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        // Yeni bildirim geldiğinde listeye ekle ve sesi çal (opsiyonel)
        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Son 20 bildirim

      if (error) throw error;
      
      setNotifications(data || []);
      // Okunmamışları say
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Bildirim hatası:", error);
    }
  };

  // --- 2. OKUNDU İŞARETLEME ---
  const markAsRead = async (id) => {
    // Önce arayüzde güncelle (Hız için)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Sonra veritabanına yaz
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).neq('is_read', true);
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  // Dışarı tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderAvatar = () => {
    if (currentUser?.avatar) return <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />;
    return <span className="text-lg font-bold">{currentUser?.name?.charAt(0) || 'U'}</span>;
  };

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30 h-20 transition-all duration-300">
      
      {/* SOL: Sidebar Toggle */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
          {sidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
        </button>
        <div className="hidden sm:block">
          <h2 className="text-xs text-gray-500 font-medium">Hoş geldin,</h2>
          <p className="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]">{currentUser?.name || 'Kullanıcı'}</p>
        </div>
      </div>
      
      {/* SAĞ: Bildirim & Profil */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* --- 🔔 BİLDİRİM KUTUSU (GERÇEK VERİ) --- */}
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>

            {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <span className="font-bold text-gray-800 text-sm">Bildirimler ({unreadCount})</span>
                        {unreadCount > 0 && (
                           <button onClick={markAllAsRead} className="text-xs text-blue-600 font-medium hover:underline">Tümünü Okundu Say</button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                           <div className="p-8 text-center text-gray-400 text-sm">Henüz bildirim yok.</div>
                        ) : (
                           notifications.map((notif) => (
                              <div 
                                 key={notif.id} 
                                 onClick={() => {
                                    markAsRead(notif.id);
                                    if(notif.link) {
                                       // Eğer link '/leave' ise sayfa yönlendirmesi yap
                                       // onNavigate prop'u ile:
                                       if(notif.link === '/leave') onNavigate('leave');
                                       setIsNotifOpen(false);
                                    }
                                 }}
                                 className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 group ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                              >
                                 <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.is_read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <p className={`text-sm ${notif.is_read ? 'font-medium text-gray-600' : 'font-bold text-gray-800'}`}>
                                          {notif.title}
                                       </p>
                                       <button onClick={(e) => deleteNotification(notif.id, e)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="w-3.5 h-3.5"/>
                                       </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                       {new Date(notif.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                 </div>
                              </div>
                           ))
                        )}
                    </div>
                    
                    <div className="p-2 border-t border-gray-50 text-center bg-gray-50/30">
                        <button className="text-xs font-bold text-gray-500 hover:text-blue-600 w-full py-2">Bildirim Ayarları</button>
                    </div>
                </div>
            )}
        </div>

        {/* --- PROFİL MENÜSÜ --- */}
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-gray-200 group">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600">{currentUser?.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">{userRole?.replace('_', ' ')}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 overflow-hidden border-2 border-white">
                    {renderAvatar()}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase">Hesabım</p>
                        <p className="text-sm font-bold text-gray-800 truncate mt-1">{currentUser?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                        <button onClick={() => { onNavigate('settings'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                            <Settings className="w-4 h-4" /> Ayarlar
                        </button>
                        <button onClick={() => { onNavigate('settings'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                            <User className="w-4 h-4" /> Profilim
                        </button>
                    </div>
                    <div className="p-2 border-t border-gray-50">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">
                            <LogOut className="w-4 h-4" /> Çıkış Yap
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}