import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; 
import { Bell } from 'lucide-react';

// --- BİLEŞENLER ---
import Sidebar from './components/layout/Sidebar';
import Login from './views/Login';
import NotificationMenu from './components/NotificationMenu';

// --- DASHBOARDLAR ---
import GeneralManagerDashboard from './views/dashboards/GeneralManagerDashboard';
import HRDashboard from './views/dashboards/HRDashboard';
import EmployeeDashboard from './views/dashboards/EmployeeDashboard';

// --- SAYFALAR ---
import Employees from './views/Employees';
import EmployeeDetail from './views/EmployeeDetail';
import Payroll from './views/Payroll';
import Recruitment from './views/Recruitment';
import Settings from './views/Settings';
import Documents from './views/Documents';
import TimeTracking from './views/TimeTracking'; 
import LeaveManagement from './views/LeaveManagement'; 

// --- MOCK DATA ---
import { notificationsData } from './data/mockData';

export default function App() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // --- BİLDİRİM STATE ---
  const [notifications, setNotifications] = useState(notificationsData || []);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- 1. OTURUM KONTROLÜ ---
  useEffect(() => {
    // İlk yüklemede oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchEmployeeDetails(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchEmployeeDetails(session.user.email);
      } else {
        setCurrentUser(null);
        setLoading(false);
        setActiveTab('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. KULLANICI DETAYLARINI VE ROLÜNÜ ÇEK ---
  const fetchEmployeeDetails = async (email) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Kullanıcı verisi boş.");

      // 🛠️ ROL BELİRLEME MANTIĞI (STRICT MODE) 🛠️
      let role = 'employee'; // Varsayılan: Standart Çalışan

      // Büyük harfe çevirip boşlukları temizleyelim (Hata önleyici)
      const position = data.position ? data.position.toUpperCase().trim() : '';
      const department = data.department ? data.department.toUpperCase().trim() : '';

      // KURAL 1: Genel Müdür Yetkisi
      // Tam eşleşme arıyoruz (General Manager, CEO vb.)
      const gmTitles = ['GENERAL MANAGER', 'CEO', 'GENEL MÜDÜR', 'FOUNDER', 'KURUCU'];
      
      if (gmTitles.includes(position)) {
        role = 'general_manager';
      } 
      
      // KURAL 2: İK Yetkisi
      // Departmanı HR, HUMAN RESOURCES veya İK ise
      else if (['HR', 'HUMAN RESOURCES', 'İK', 'INSAN KAYNAKLARI'].includes(department)) {
        role = 'hr';
      }

      // KURAL 3: Geriye kalan herkes (Sales Manager vb.) employee olur.

      console.log(`Giriş: ${data.name}, Rol: ${role}`);
      setCurrentUser({ ...data, role }); 

    } catch (error) {
      console.error("Kullanıcı verisi hatası:", error);
      // Hata olsa bile sistemi aç, ama yetkisiz (misafir) olarak
      setCurrentUser({ name: 'Misafir', role: 'employee', id: 0 });
    } finally {
      // ✅ Yükleme ekranını mutlaka kapat
      setLoading(false);
    }
  };

  // Profil Güncelleme Tetikleyicisi
  const refreshUser = async () => {
    if (currentUser?.email) {
      await fetchEmployeeDetails(currentUser.email);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  // Header Avatar Helper
  const getHeaderAvatar = () => {
    if (currentUser?.avatar) {
      return <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />;
    }
    const name = currentUser?.name || 'US';
    return name.slice(0, 2).toUpperCase();
  };

  // --- RENDER MANTIĞI ---
  const userRole = currentUser?.role || 'employee';

 const renderDashboardByRole = () => {
    switch (userRole) {
      case 'general_manager': return <GeneralManagerDashboard onNavigate={setActiveTab} />;
      case 'hr': return <HRDashboard onNavigate={setActiveTab} />;
      // 👇 BURAYI GÜNCELLE: currentUser prop'unu ekledik
      default: return <EmployeeDashboard onNavigate={setActiveTab} currentUser={currentUser} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardByRole();
      
      case 'employees':
        if (selectedEmployee) return <EmployeeDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
        return <Employees onViewProfile={(emp) => setSelectedEmployee(emp)} userRole={userRole} />;
      
      case 'payroll': return <Payroll />;
      case 'recruitment': return <Recruitment />;
      
      case 'time-tracking': 
        // 👇 BURASI KRİTİK: userRole'ü göndermezsek yönetici olduğunu anlamaz!
        return <TimeTracking currentUserId={currentUser?.id} userRole={userRole} />;
      
      case 'leave': 
        // 👇 Aynı şekilde buraya da ekliyoruz
        return <LeaveManagement currentUserId={currentUser?.id} userRole={userRole} />;
      
      case 'settings': 
        return <Settings 
                 userRole={userRole} 
                 currentUserId={currentUser?.id} 
                 onProfileUpdate={refreshUser} 
               />;
      
      case 'documents': return <Documents />;
      default: return renderDashboardByRole();
    }
  };

  const filteredNotifications = notifications.filter(n => !n.targetRole || n.targetRole.includes(userRole));

  // Yükleme Ekranı
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Yükleniyor...</div>;
  
  // Giriş Ekranı
  if (!session) return <Login />;

  return (
    <div className="flex h-screen bg-gray-50" onClick={() => setShowNotifications(false)}> 
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
           if(tab === 'logout') handleLogout(); 
           else { setActiveTab(tab); setSelectedEmployee(null); }
        }} 
        sidebarOpen={sidebarOpen}
        userRole={userRole} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-xl font-bold text-gray-800 capitalize">{activeTab.replace('-', ' ')}</h2>
            
            <div className="flex items-center gap-4">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600">
                  <Bell className="w-6 h-6" />
                  {filteredNotifications.some(n => !n.isRead) && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
                </button>
                {showNotifications && <NotificationMenu notifications={filteredNotifications} onClose={() => setShowNotifications(false)} />}
              </div>

              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 uppercase">{userRole.replace('_', ' ')}</p>
              </div>
              
              <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity">
                {getHeaderAvatar()}
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