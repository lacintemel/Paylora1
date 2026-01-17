import React from 'react';
import { navItems } from '../../config/navConfig';
import { LogOut } from 'lucide-react'; // İkonu ekledik

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, userRole }) {
  // Kullanıcının rolüne göre menü öğelerini filtrele
  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside 
      className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* LOGO ALANI */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <h1 className={`font-bold text-xl tracking-wider transition-all ${!sidebarOpen && "hidden"}`}>
          PAYLORA
        </h1>
        {!sidebarOpen && <span className="font-bold text-xl">P</span>}
      </div>

      {/* MENÜ LİSTESİ */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left group
                ${isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              <span className={`font-medium whitespace-nowrap ${!sidebarOpen && "hidden"}`}>
                {item.label}
              </span>
              
              {/* Aktif sekme için sağ tarafta küçük nokta işareti */}
              {isActive && sidebarOpen && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ALT KISIM: ÇIKIŞ YAP BUTONU */}
      <div className="p-4 border-t border-gray-800 mt-auto">
        <button 
          onClick={() => setActiveTab('logout')} // 'logout' sinyalini gönder
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300`}
        >
          <LogOut className="w-5 h-5" />
          <span className={`font-medium whitespace-nowrap ${!sidebarOpen && "hidden"}`}>
            Çıkış Yap
          </span>
        </button>
      </div>

    </aside>
  );
}