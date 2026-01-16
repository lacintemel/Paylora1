import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
// Header componenti varsa import Header from './components/layout/Header';

// --- DASHBOARDLAR ---
import GeneralManagerDashboard from './views/dashboards/GeneralManagerDashboard';
import HRDashboard from './views/dashboards/HRDashboard';
import EmployeeDashboard from './views/dashboards/EmployeeDashboard';

// --- SAYFALAR (VIEWS) ---
import Employees from './views/Employees';
import Payroll from './views/Payroll';
import TimeTracking from './views/TimeTracking';
import LeaveManagement from './views/LeaveManagement';
import Recruitment from './views/Recruitment';
import Settings from './views/Settings';
import Documents from './views/Documents';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ROLÜ BURADAN SEÇEBİLİRSİNİZ: 'general_manager', 'hr', 'employee'
  const [currentRole] = useState('general_manager'); 

  // Dashboard Seçici (Manager kaldırıldı)
  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'general_manager': return <GeneralManagerDashboard />;
      case 'hr': return <HRDashboard />;
      case 'employee': return <EmployeeDashboard />;
      default: return <EmployeeDashboard />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardByRole();
      case 'employees': return <Employees />;
      case 'payroll': return <Payroll />;
      case 'time-tracking': return <TimeTracking />;
      case 'leave': return <LeaveManagement />;
      case 'recruitment': return <Recruitment />;
      case 'settings': return <Settings />;
      case 'documents': return <Documents />;
      default: return renderDashboardByRole();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        userRole={currentRole} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Alanı */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">Kullanıcı</p>
                <p className="text-xs text-gray-500 uppercase">{currentRole.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
            </div>
        </div>
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}