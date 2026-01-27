import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';

// --- BİLEŞENLER (Layout) ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './views/Login';


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
import Planner from './views/Planner';
import Performance from './views/Performance';
import Announcements from './views/Announcements';
import NotificationsPage from './views/Notifications';
import Sales from './views/Sales';
export default function App() {
  // --- STATE YÖNETİMİ ---
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // 🌍 GLOBAL ŞİRKET AYARLARI (Sidebar Logosu İçin Kritik)
  const [companySettings, setCompanySettings] = useState(null);

  // --- BAŞLANGIÇ (VERİLERİ ÇEK) ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.email);
        fetchCompanySettings(); // <--- KRİTİK: Uygulama açılınca ayarları çek
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCurrentUser(session.user.email);
        fetchCompanySettings(); // <--- KRİTİK: Giriş yapınca ayarları çek
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setCompanySettings(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCurrentUser = async (email) => {
    if (!email) return;
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      
      if (data) {
        setCurrentUser(data);
        if (['admin@paymaki.com', 'ceo@paymaki.com'].includes(data.email)) setUserRole('general_manager');
        else if (data.email === 'hr@paymaki.com' || data.department === 'HR') setUserRole('hr');
        else setUserRole('employee'); 
      }
    } catch (error) {
      console.error('Kullanıcı hatası:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. ŞİRKET AYARLARINI ÇEK (SIDEBAR İÇİN) ---
const fetchCompanySettings = async () => {
    try {
      // .maybeSingle() kullanıyoruz. Çünkü .single() birden fazla satır varsa patlar.
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle(); 
      
      if (error) {
         console.error("KRİTİK HATA: Şirket ayarları çekilemedi!", error.message);
      }

      if (data) {
        console.log("BAŞARILI: Şirket ayarları geldi:", data); // Konsola bak, bu yazıyor mu?
        setCompanySettings(data);
      } else {
        console.warn("UYARI: Veritabanında company_settings tablosu boş!");
      }
    } catch (err) {
      console.error("Bilinmeyen Hata:", err);
    }
  };

  // --- NAVİGASYON ---
  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSelectedEmployee(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('dashboard');
  };

  // --- SAYFA RENDER ---
  // --- SAYFA RENDER MANTIĞI (GÜVENLİK GÜNCELLEMESİ) ---
 const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // 👇 DÜZELTME BURADA: userRole ve currentUser'ı ekledik
        if (userRole === 'general_manager') {
            return <GeneralManagerDashboard 
                      onNavigate={handleNavigate} 
                      userRole={userRole} 
                      currentUser={currentUser} 
                   />;
        }
        if (userRole === 'hr') {
            return <HRDashboard 
                      onNavigate={handleNavigate} 
                      userRole={userRole} 
                      currentUser={currentUser} 
                   />;
        }
        return <EmployeeDashboard onNavigate={handleNavigate} currentUser={currentUser} />;
      
      case 'employees':
        if (selectedEmployee) {
            return <EmployeeDetail 
                      employee={selectedEmployee} 
                      userRole={userRole} 
                      onBack={() => setSelectedEmployee(null)} 
                   />;
        }
        return <Employees onViewProfile={(emp) => setSelectedEmployee(emp)} userRole={userRole} />;
      
      case 'time-tracking': return <TimeTracking currentUserId={currentUser?.id} userRole={userRole} />;
      case 'leave': return <LeaveManagement currentUserId={currentUser?.id} userRole={userRole} />;
      case 'payroll': return <Payroll currentUserId={currentUser?.id} userRole={userRole} />;
      case 'sales': return <Sales currentUserId={currentUser?.id} userRole={userRole} />;
      case 'planner': return <Planner userRole={userRole} currentUserId={currentUser?.id} />;
      case 'performance': return <Performance userRole={userRole} currentUserId={currentUser?.id} />;
      case 'notifications':
        return (
          <NotificationsPage 
             currentUser={currentUser} 
             onNavigate={setActiveTab} // Sayfa içinde gezinmek için
          />
        );
      // ARTIK ANNOUNCEMENTS SAYFASINA GEREK YOK (Dashboard'a gömdük), BU SATIRI SİLEBİLİRSİN:
       case 'announcements': return <Announcements userRole={userRole} currentUser={currentUser} onNavigate={setActiveTab}/>;
      
      case 'recruitment': 
        if (userRole === 'employee') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                        <h3 className="text-lg font-bold text-red-600 mb-2">Erişim Reddedildi</h3>
                        <p>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
                    </div>
                </div>
            );
        }
        return <Recruitment />;
      
      case 'documents': 
        return <Documents userRole={userRole} currentUserId={currentUser?.id} />;
      
      case 'settings': 
        return <Settings 
          userRole={userRole} 
          currentUserId={currentUser?.id} 
          onUpdate={() => {
             // fetchCurrentUser ve fetchCompanySettings fonksiyonlarının burada erişilebilir olduğundan emin ol
             // Eğer hata verirse props olarak geçmen gerekebilir
          }} 
        />;
      
      default: return <div className="p-10 text-center text-gray-500">Sayfa bulunamadı: {activeTab}</div>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  if (!session) return <Login />;

return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* 1. SOL TARAFTA SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        
        // ❌ HATALI OLAN: onNavigate={setCurrentView}
        // ✅ DOĞRUSU (Bunu yapıştır):
        onNavigate={setActiveTab} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        companySettings={companySettings}
        userRole={userRole}
        
      />

      {/* 2. SAĞ TARAFTA İÇERİK ALANI */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* A. EN ÜSTTE HEADER (Bildirimler Burada) */}
        <Header 
          currentUser={currentUser} // 👈 Bildirimler için şart
          userRole={userRole}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
        />

        {/* B. ANA İÇERİK (Dashboard, İzinler vb. buraya gelir) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
              {renderContent()}
           </div>
        </main>
      </div>
      
      {/* Toast Notification Container */}
      <Toaster />

    </div>
  )};