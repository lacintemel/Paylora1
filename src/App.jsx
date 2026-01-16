// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// View'ları import et
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Payroll from './views/Payroll';
// Diğerlerini de import et:
import TimeTracking from './views/TimeTracking';
 import LeaveManagement from './views/LeaveManagement';
 import Benefits from './views/Benefits';
 import Documents from './views/Documents';
import Settings from './views/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'employees': return <Employees />;
      case 'payroll': return <Payroll />;
      case 'time': return <TimeTracking />;
      case 'leave': return <LeaveManagement />;
      case 'benefits': return <Benefits />;
      case 'documents': return <Documents />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}