import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Login from './views/Login';
import NotificationMenu from './components/NotificationMenu';

// --- DATA ---
import { notificationsData } from './data/mockData';

// --- DASHBOARDLAR ---
import GeneralManagerDashboard from './views/dashboards/GeneralManagerDashboard';
import HRDashboard from './views/dashboards/HRDashboard';
import EmployeeDashboard from './views/dashboards/EmployeeDashboard';

// --- SAYFALAR (VIEWS) ---
import Employees from './views/Employees';
import EmployeeDetail from './views/EmployeeDetail';
import Payroll from './views/Payroll';
import TimeTracking from './views/TimeTracking';
import LeaveManagement from './views/LeaveManagement';
import Recruitment from './views/Recruitment';
import Settings from './views/Settings';
import Documents from './views/Documents';

export default function App() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [currentRole, setCurrentRole] = useState('general_manager'); 

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // --- BİLDİRİM STATE'LERİ ---
  const [notifications, setNotifications] = useState(notificationsData || []);
  const [showNotifications, setShowNotifications] = useState(false);
  const filteredNotifications = notifications.filter(n => 
  n.targetRole.includes(currentRole)
);
  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  // --- GİRİŞ / ÇIKIŞ ---
  const handleLogin = (role) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedEmployee(null);
    setActiveTab('dashboard');
    setCurrentRole('general_manager');
    setShowNotifications(false);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  // --- RENDER MANTIĞI ---
  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'general_manager': return <GeneralManagerDashboard onNavigate={setActiveTab} />;
      case 'hr': return <HRDashboard onNavigate={setActiveTab} />;
      case 'employee': return <EmployeeDashboard onNavigate={setActiveTab} />;
      default: return <EmployeeDashboard onNavigate={setActiveTab} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardByRole();
     case 'employees':
        // 👇 BURASI ÇOK ÖNEMLİ! userRole={currentRole} satırını ekledik.
        if (selectedEmployee) {
          return (
            <EmployeeDetail 
              employee={selectedEmployee} 
              onBack={() => setSelectedEmployee(null)} 
            />
          );
        }
        return (
          <Employees 
            onViewProfile={(emp) => setSelectedEmployee(emp)} 
            userRole={currentRole}  // 👈 İŞTE EKSİK OLAN BU SATIR!
          />
        );
      case 'payroll': return <Payroll />;
      case 'time-tracking': return <TimeTracking />;
      case 'leave': return <LeaveManagement />;
      case 'recruitment': return <Recruitment />;
      case 'settings':
  // 👇 userRole prop'unu ekledik
  return <Settings userRole={currentRole} />;
      case 'documents': return <Documents />;
      default: return renderDashboardByRole();
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'employees') return selectedEmployee ? 'Çalışan Profili' : 'Çalışan Yönetimi';
    if (activeTab === 'payroll') return 'Maaş & Bordro';
    if (activeTab === 'time-tracking') return 'Zaman Takibi';
    if (activeTab === 'leave') return 'İzin Yönetimi';
    if (activeTab === 'recruitment') return 'İşe Alım';
    if (activeTab === 'settings') return 'Şirket Ayarları';
    if (activeTab === 'documents') return 'Belgelerim';
    return 'Sayfa';
  };

  return (
    <div className="flex h-screen bg-gray-50" onClick={() => setShowNotifications(false)}> 
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'logout') handleLogout();
          else { setActiveTab(tab); setSelectedEmployee(null); }
        }} 
        sidebarOpen={sidebarOpen}
        userRole={currentRole} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-xl font-bold text-gray-800 capitalize">{getPageTitle()}</h2>
            
            <div className="flex items-center gap-4">
              
              {/* --- BİLDİRİM ALANI --- */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative text-gray-600"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationMenu 
                    notifications={filteredNotifications}
                    onMarkAsRead={markAsRead}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">
                  {currentRole === 'general_manager' ? 'Laci Temel' : 
                   currentRole === 'hr' ? 'İK Yöneticisi' : 'Kullanıcı'}
                </p>
                <p className="text-xs text-gray-500 uppercase">{currentRole.replace('_', ' ')}</p>
              </div>
              
              <button onClick={handleLogout} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold hover:bg-gray-700 transition-colors shadow-sm">
                {currentRole === 'general_manager' ? 'LT' : currentRole === 'hr' ? 'İK' : 'U'}
              </button>
            </div>
        </div>
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}