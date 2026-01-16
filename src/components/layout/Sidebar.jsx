import React from 'react';
import { Briefcase } from 'lucide-react';
import { navItems } from '../../config/navConfig'; 

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, userRole }) {
  
  // HATA AYIKLAMA: Konsola rolü yazdırıyoruz
  console.log("Sidebar'a gelen rol:", userRole);

  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(userRole)
  );

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 text-white transition-all duration-300 overflow-hidden shadow-xl h-full flex flex-col border-r border-gray-800`}>
      <div className="p-6 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className={`transition-opacity duration-200 ${!sidebarOpen && 'opacity-0'}`}>
            <h1 className="text-xl font-bold tracking-tight">Paylora</h1>
            <p className="text-xs text-gray-400 font-medium">WorkForce Pro</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}