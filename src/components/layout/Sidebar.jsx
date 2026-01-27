import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, 
  FileText, Briefcase, File, Building2, LogOut, BarChart2,
  Menu, TrendingUp
} from 'lucide-react';

export default function Sidebar({ activeTab, onNavigate, onLogout, isOpen, toggleSidebar, companySettings, userRole }) {
  
  // Menü öğeleri
  const allMenuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'employees', label: 'Çalışanlar', icon: Users },
    { id: 'time-tracking', label: 'Zaman Takibi', icon: Clock },
    { id: 'leave', label: 'İzinler', icon: Calendar },
    { id: 'payroll', label: 'Bordro', icon: FileText },
    { id: 'recruitment', label: 'İşe Alım', icon: Briefcase, roles: ['general_manager', 'hr'] },
    { id: 'sales', label: 'Satışlar', icon: TrendingUp },
    { id: 'documents', label: 'Dokümanlar', icon: File },
    { id: 'planner', label: 'Ajanda & Takvim', icon: Calendar },
    { id: 'performance', label: 'Performans', icon: BarChart2 }, 
  ];

  // Rol kontrolü
  const menuItems = allMenuItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    return true;
  });

  const companyName = companySettings?.company_name || 'PayMaki';
  const logoUrl = companySettings?.company_logo;
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [logoUrl]);

  return (
    <div className={`
      ${isOpen ? 'w-64' : 'w-20'} 
      bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50 
      transition-all duration-300 ease-in-out shadow-sm
    `}>
      
      {/* HEADER ALANI (LOGO + MENÜ BUTONU) */}
      <div className={`h-20 flex items-center px-4 border-b border-gray-100 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        
        {/* LOGO (Sadece Açıkken Görünür) */}
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
           {logoUrl && !imgError ? (
              <img src={logoUrl} alt="Logo" onError={() => setImgError(true)} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-200 shrink-0"/>
           ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
           )}
           <div className="overflow-hidden">
             <h1 className="text-sm font-bold text-gray-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={companyName}>
               {companyName}
             </h1>
           </div>
        </div>

        {/* 👇 YENİ TOGGLE BUTONU (3 Çizgi) */}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
          title={isOpen ? "Menüyü Daralt" : "Menüyü Genişlet"}
        >
          <Menu className="w-6 h-6" />
        </button>

      </div>

      {/* MENÜ LİSTESİ */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id)} 
              title={!isOpen ? item.label : ''} 
              className={`
                w-full flex items-center rounded-xl transition-all duration-200 relative group
                ${isOpen ? 'px-4 py-3 gap-3' : 'justify-center py-3 px-0'} 
                ${activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                } 
              `}
            >
              {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>}
              
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </button>
        ))}
      </nav>

      {/* ÇIKIŞ */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button 
          onClick={onLogout} 
          className={`
            w-full flex items-center justify-center rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors 
            ${isOpen ? 'px-4 py-3 gap-2' : 'py-3'}
          `}
        >
          <LogOut className="w-5 h-5" />
          <span className={`${isOpen ? 'block' : 'hidden'}`}>Çıkış</span>
        </button>
      </div>
    </div>
  );
}