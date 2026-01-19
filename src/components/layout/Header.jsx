import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, currentUser, userRole, onNavigate, onLogout }) {
  // --- STATE (BEYİN) ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menü açıkken dışarı tıklanırsa kapatma mantığı
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Avatar Helper (Resim yoksa baş harf göster)
  const renderAvatar = () => {
    if (currentUser?.avatar && currentUser.avatar.startsWith('http')) {
      return <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />;
    }
    return <span className="text-lg font-bold">{currentUser?.name?.charAt(0) || 'U'}</span>;
  };

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      
      {/* SOL TARAFI: Mobil Menü Butonu & Selamlama */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xs text-gray-500 font-medium">Hoş geldin,</h2>
          <p className="font-bold text-gray-800 text-lg leading-tight">
            {currentUser?.name || 'Yükleniyor...'}
          </p>
        </div>
      </div>
      
      {/* SAĞ TARAF: Bildirim & Profil */}
      <div className="flex items-center gap-6">
        
        {/* Bildirim Zili (Şimdilik görsel) */}
        <button className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* --- PROFİL ALANI (DROPDOWN BURADA) --- */}
        <div className="relative" ref={dropdownRef}>
            
            {/* TIKLANABİLİR PROFİL KUTUSU */}
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-gray-200 group"
            >
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {currentUser?.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                        {userRole?.replace('_', ' ')}
                    </p>
                </div>

                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-200 overflow-hidden border-2 border-white">
                    {renderAvatar()}
                </div>
                
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* --- AÇILAN MENÜ --- */}
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    
                    {/* Menü Başlığı */}
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase">Hesap Bilgileri</p>
                        <p className="text-sm font-bold text-gray-800 truncate mt-1">{currentUser?.email}</p>
                    </div>
                    
                    {/* Menü Linkleri */}
                    <div className="p-2 space-y-1">
                        <button 
                            onClick={() => {
                                onNavigate('settings'); // Ayarlara git
                                setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <Settings className="w-4 h-4" /> Ayarlar
                        </button>
                        
                        <button 
                             onClick={() => {
                                onNavigate('settings'); // Profil de Settings sayfasında
                                setIsDropdownOpen(false);
                             }}
                             className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" /> Profilim
                        </button>
                    </div>

                    {/* Çıkış Yap */}
                    <div className="p-2 border-t border-gray-50">
                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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