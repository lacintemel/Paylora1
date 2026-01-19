import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Settings, LogOut, User, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, currentUser, userRole, onNavigate, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); // Bildirim State'i
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Dışarı tıklayınca menüleri kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
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
        
        {/* --- BİLDİRİM KUTUSU (BURASI DÜZELTİLDİ) --- */}
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
            >
                <Bell className="w-6 h-6" />
                {/* Kırmızı Nokta */}
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* AÇILIR BİLDİRİM MENÜSÜ */}
            {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <span className="font-bold text-gray-800 text-sm">Bildirimler</span>
                        <span className="text-xs text-blue-600 font-medium cursor-pointer">Tümünü Okundu İşaretle</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {/* Örnek Bildirim 1 */}
                        <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3">
                           <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                           <div>
                              <p className="text-sm font-bold text-gray-800">Maaşlar Hesaplandı</p>
                              <p className="text-xs text-gray-500 mt-1">Ocak 2026 dönemine ait maaş bordroları onay bekliyor.</p>
                              <p className="text-[10px] text-gray-400 mt-2">2 saat önce</p>
                           </div>
                        </div>
                        {/* Örnek Bildirim 2 */}
                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3">
                           <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                           <div>
                              <p className="text-sm font-bold text-gray-800">Yeni İzin Talebi</p>
                              <p className="text-xs text-gray-500 mt-1">Ahmet Yılmaz 3 gün yıllık izin talep etti.</p>
                              <p className="text-[10px] text-gray-400 mt-2">5 saat önce</p>
                           </div>
                        </div>
                    </div>
                    
                    <div className="p-2 border-t border-gray-50 text-center">
                        <button className="text-xs font-bold text-gray-500 hover:text-blue-600 w-full py-2">Tümünü Gör</button>
                    </div>
                </div>
            )}
        </div>

        {/* --- PROFİL --- */}
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