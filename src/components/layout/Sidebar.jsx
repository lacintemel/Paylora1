import React from 'react';
import { 
  LayoutDashboard, Users, Clock, Calendar, 
  FileText, Briefcase, File, Building2, LogOut, Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, onNavigate, onLogout }) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'employees', label: 'Çalışanlar', icon: Users },
    { id: 'time-tracking', label: 'Zaman Takibi', icon: Clock },
    { id: 'leave', label: 'İzinler', icon: Calendar },
    { id: 'payroll', label: 'Bordro', icon: FileText },
    { id: 'recruitment', label: 'İşe Alım', icon: Briefcase },
    { id: 'documents', label: 'Dokümanlar', icon: File },
    // Ayarları menüde de görmek istersen burayı açabilirsin:
    // { id: 'settings', label: 'Ayarlar', icon: Settings }, 
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50">
      
      {/* --- LOGO ALANI --- */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Paylora</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HR SYSTEM</p>
        </div>
      </div>

      {/* --- MENÜLER --- */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }
              `}
            >
              {/* Aktif İndikatörü */}
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>}
              
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* --- ALT KISIM (ÇIKIŞ) --- */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}