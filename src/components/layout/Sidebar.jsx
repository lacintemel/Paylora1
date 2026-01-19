import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, 
  FileText, Briefcase, File, Building2, LogOut, BarChart2
} from 'lucide-react';

// userRole prop'unu eklemeyi unutma 👇
export default function Sidebar({ activeTab, onNavigate, onLogout, isOpen, companySettings, userRole }) {
  
  // Menü öğelerini dinamik filtreleyeceğiz
  const allMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'employees', label: 'Çalışanlar', icon: Users },
    { id: 'time-tracking', label: 'Zaman Takibi', icon: Clock },
    { id: 'leave', label: 'İzinler', icon: Calendar },
    { id: 'payroll', label: 'Bordro', icon: FileText },
    { id: 'recruitment', label: 'İşe Alım', icon: Briefcase, roles: ['general_manager', 'hr'] }, // Sadece bu rollere özel
    { id: 'documents', label: 'Dokümanlar', icon: File },
    { id: 'planner', label: 'Ajanda & Takvim', icon: Calendar },
    { id: 'performance', label: 'Performans', icon: BarChart2 }, // BarChart2'yi lucide-react'ten import et
  ];

  // Rol kontrolü yaparak menüyü filtrele
  const menuItems = allMenuItems.filter(item => {
    // Eğer item.roles tanımlıysa, kullanıcının rolü bu dizide var mı bak
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    // Roles tanımlı değilse herkese göster
    return true;
  });

  const companyName = companySettings?.company_name || 'Paylora';
  const logoUrl = companySettings?.company_logo;
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [logoUrl]);

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out shadow-sm`}>
      
      {/* LOGO ALANI */}
      <div className={`h-20 flex items-center px-6 border-b border-gray-100 ${isOpen ? 'gap-3' : 'justify-center'}`}>
        {logoUrl && !imgError ? (
           <img src={logoUrl} alt="Logo" onError={() => setImgError(true)} className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200 shrink-0"/>
        ) : (
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0 transition-transform hover:scale-105"><Building2 className="w-6 h-6" /></div>
        )}
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
          <h1 className="text-sm font-bold text-gray-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={companyName}>{companyName}</h1>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">HR SYSTEM</p>
        </div>
      </div>

      {/* MENÜ */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {menuItems.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)} title={!isOpen ? item.label : ''} className={`w-full flex items-center rounded-xl transition-all duration-200 relative group ${isOpen ? 'px-4 py-3 gap-3' : 'justify-center py-3 px-0'} ${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}>
              {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{item.label}</span>
            </button>
        ))}
      </nav>

      {/* ÇIKIŞ */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button onClick={onLogout} className={`w-full flex items-center justify-center rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors ${isOpen ? 'px-4 py-3 gap-2' : 'py-3'}`}>
          <LogOut className="w-5 h-5" /><span className={`${isOpen ? 'block' : 'hidden'}`}>Çıkış</span>
        </button>
      </div>
    </div>
  );
}