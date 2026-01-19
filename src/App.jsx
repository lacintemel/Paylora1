import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

// --- BİLEŞENLER (Layout) ---
import Sidebar from './components/layout/Sidebar'; // Senin dosya yolun
import Header from './components/layout/Header';
import Login from './views/Login';

// --- DASHBOARDLAR ---
import GeneralManagerDashboard from './views/dashboards/GeneralManagerDashboard';
import HRDashboard from './views/dashboards/HRDashboard';
import EmployeeDashboard from './views/dashboards/EmployeeDashboard';

// --- SAYFALAR ---
import Employees from './views/Employees';
import EmployeeDetail from './views/EmployeeDetail'; // Detay sayfası eklendi
import Payroll from './views/Payroll';
import Recruitment from './views/Recruitment';
import Settings from './views/Settings';
import Documents from './views/Documents';
import TimeTracking from './views/TimeTracking'; 
import LeaveManagement from './views/LeaveManagement';

export default function App() {
  // --- STATE YÖNETİMİ ---
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sidebar Açık/Kapalı Durumu (Varsayılan: Açık)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Çalışan Detayına Gitmek İçin State
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // --- AUTH & USER LOADER ---
  useEffect(() => {
    // 1. Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCurrentUser(session.user.email); // ID yerine Email kullanıyoruz (Daha güvenli)
      else setLoading(false);
    });

    // 2. Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCurrentUser(session.user.email);
      else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👇 KULLANICIYI EMAIL İLE ÇEKME FONKSİYONU
  const fetchCurrentUser = async (email) => {
    if (!email) return;
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email) // Kritik Düzeltme: Email eşleşmesi
        .single();

      if (error) throw error;
      
      if (data) {
        setCurrentUser(data);
        
        // Basit Rol Belirleme Mantığı
        // (İstersen burayı senin eski kodundaki gibi 'position' kontrolüyle değiştirebilirsin)
        if (['admin@paylora.com', 'ceo@paylora.com'].includes(data.email)) setUserRole('general_manager');
        else if (data.email === 'hr@paylora.com' || data.department === 'HR') setUserRole('hr');
        else setUserRole('employee'); 
      }
    } catch (error) {
      console.error('Kullanıcı verisi alınamadı:', error.message);
      // Hata durumunda session varsa bile loading'i kapat
    } finally {
      setLoading(false);
    }
  };

  // --- NAVİGASYON ---
  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSelectedEmployee(null); // Sayfa değişince detay görünümünden çık
  };

  const handleLogin = () => setActiveTab('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setUserRole(null);
    setActiveTab('dashboard');
  };

  // --- SAYFA RENDER MANTIĞI ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (userRole === 'general_manager') return <GeneralManagerDashboard onNavigate={handleNavigate} />;
        if (userRole === 'hr') return <HRDashboard onNavigate={handleNavigate} />;
        return <EmployeeDashboard onNavigate={handleNavigate} currentUser={currentUser} />;
      
      case 'employees':
        // Eğer bir çalışan seçildiyse detay sayfasını göster
        if (selectedEmployee) {
            return <EmployeeDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
        }
        return <Employees onViewProfile={(emp) => setSelectedEmployee(emp)} userRole={userRole} />;
      
      case 'time-tracking': 
        return <TimeTracking currentUserId={currentUser?.id} userRole={userRole} />;
      
      case 'leave': 
        return <LeaveManagement currentUserId={currentUser?.id} userRole={userRole} />;
      
      case 'payroll': 
        return <Payroll currentUserId={currentUser?.id} userRole={userRole} />;
      
      case 'recruitment': 
        return <Recruitment />;
      
      case 'documents': 
        return <Documents userRole={userRole} />;
      
      case 'settings': 
        // Profil güncellenince Header fotosunun da değişmesi için fonksiyonu gönderiyoruz
        return <Settings 
          userRole={userRole} 
          currentUserId={currentUser?.id} 
          onProfileUpdate={() => fetchCurrentUser(session.user.email)} 
        />;
      
      default: 
        return <div className="p-10 text-center text-gray-500">Sayfa bulunamadı: {activeTab}</div>;
    }
  };

  // Yükleme Ekranı
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p>Yükleniyor...</p>
      </div>
    </div>
  );

  // Giriş Ekranı
  if (!session) return <Login onLogin={handleLogin} />;

  // --- ANA EKRAN ---
  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      
      {/* 1. SOL MENÜ (Sidebar) */}
      <Sidebar 
        activeTab={activeTab} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen} // Açık/Kapalı durumunu gönderiyoruz
      />

      {/* 2. ANA İÇERİK ALANI */}
      {/* Sidebar açıksa 64 birim (256px), kapalıysa 20 birim (80px) boşluk bırak */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
         
         {/* A) HEADER (Üst Bar) */}
         <Header 
            sidebarOpen={isSidebarOpen} 
            setSidebarOpen={setIsSidebarOpen} // Toggle fonksiyonu
            currentUser={currentUser}
            userRole={userRole}
            onNavigate={handleNavigate} 
            onLogout={handleLogout}
         />

         {/* B) SAYFA İÇERİĞİ */}
         <main className="flex-1 p-8 overflow-y-auto">
            {renderContent()}
         </main>

      </div>
    </div>
  );
}