import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

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

  // --- 1. KULLANICI BİLGİLERİNİ ÇEK ---
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
        // Basit Rol Atama
        if (['admin@paylora.com', 'ceo@paylora.com'].includes(data.email)) setUserRole('general_manager');
        else if (data.email === 'hr@paylora.com' || data.department === 'HR') setUserRole('hr');
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
        if (userRole === 'general_manager') return <GeneralManagerDashboard onNavigate={handleNavigate} />;
        if (userRole === 'hr') return <HRDashboard onNavigate={handleNavigate} />;
        return <EmployeeDashboard onNavigate={handleNavigate} currentUser={currentUser} />;
      
      case 'employees':
        if (selectedEmployee) {
            // 👇 GÜNCELLEME: userRole prop'unu buraya ekledik!
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
      case 'planner': 
      return <Planner userRole={userRole} currentUserId={currentUser?.id} />;
      case 'performance':
      return <Performance userRole={userRole} currentUserId={currentUser?.id} />;
      
      // 🔒 GÜVENLİK KONTROLÜ 1: İşe Alım
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
      
      // 🔒 GÜVENLİK KONTROLÜ 2: Dokümanlar (ID gönderiyoruz)
      case 'documents': 
        return <Documents userRole={userRole} currentUserId={currentUser?.id} />;
      
      case 'settings': 
        return <Settings 
          userRole={userRole} 
          currentUserId={currentUser?.id} 
          onUpdate={() => {
             fetchCurrentUser(session.user.email);
             fetchCompanySettings();
          }} 
        />;
      
      default: return <div className="p-10 text-center text-gray-500">Sayfa bulunamadı: {activeTab}</div>;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  if (!session) return <Login />;

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      
      {/* 1. SIDEBAR: Ayarları buraya prop olarak gönderiyoruz */}
    <Sidebar 
  activeTab={activeTab} 
  onNavigate={handleNavigate} 
  onLogout={handleLogout}
  isOpen={isSidebarOpen} 
  companySettings={companySettings}
  userRole={userRole} // 👈 YENİ: Bunu eklemezsen Sidebar menüyü gizleyemez!
/>

      {/* 2. İÇERİK ALANI */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
         
         <Header 
            sidebarOpen={isSidebarOpen} 
            setSidebarOpen={setIsSidebarOpen} 
            currentUser={currentUser}
            userRole={userRole}
            onNavigate={handleNavigate} 
            onLogout={handleLogout}
         />

         <main className="flex-1 p-8 overflow-y-auto">
            {renderContent()}
         </main>

      </div>
    </div>
  );
}