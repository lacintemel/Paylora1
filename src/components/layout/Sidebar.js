// src/components/layout/Sidebar.jsx
import React from 'react';
import { Home, Users, Clock, Calendar, DollarSign, Heart, FileText, Settings, Briefcase } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'employees', icon: Users, label: 'Employees' },
    { id: 'time', icon: Clock, label: 'Time & Attendance' },
    { id: 'leave', icon: Calendar, label: 'Leave Management' },
    { id: 'payroll', icon: DollarSign, label: 'Payroll' },
    { id: 'benefits', icon: Heart, label: 'Benefits' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 overflow-hidden shadow-xl h-full flex flex-col`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">WorkForce</h1>
            <p className="text-xs text-gray-400">HCM Platform</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 px-3 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'hover:bg-gray-700 text-gray-300'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}