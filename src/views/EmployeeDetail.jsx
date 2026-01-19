import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, 
  CreditCard, FileText, CheckCircle, XCircle, ShieldAlert, User, Briefcase
} from 'lucide-react';

export default function EmployeeDetail({ employee, onBack, userRole }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    leaves: [],
    payrolls: [],
    logs: []
  });

  // Profil Fotosu Hata Kontrolü
  const [imgError, setImgError] = useState(false);

  // 🔒 YETKİ KONTROLÜ (Manager ve HR görebilir)
  const isAuthorized = ['general_manager', 'hr'].includes(userRole);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    if (employee?.id) fetchEmployeeHistory();
  }, [employee]);

  const fetchEmployeeHistory = async () => {
    setLoading(true);
    try {
      // 1. İzin Geçmişi
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      // 2. Maaş Geçmişi (Sadece Yetkili Görür)
      let payrolls = [];
      if (isAuthorized) {
        const { data: payrollData } = await supabase
            .from('payrolls')
            .select('*')
            .eq('employee_id', employee.id)
            .order('period', { ascending: false });
        payrolls = payrollData || [];
      }

      // 3. Zaman Logları
      const { data: logs } = await supabase
        .from('time_logs')
        .select('*')
        .eq('employee_id', employee.id)
        .order('date', { ascending: false })
        .limit(10);

      setData({
        leaves: leaves || [],
        payrolls: payrolls,
        logs: logs || []
      });

    } catch (error) {
      console.error("Detay verisi hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Status Renkleri
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': case 'Paid': return 'bg-green-100 text-green-700';
      case 'Pending': case 'Processing': return 'bg-orange-100 text-orange-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper: Kalan İzin Hesaplama (Basit mantık)
  const totalLeaveDays = 14; // Yıllık hak
  const usedLeaveDays = data.leaves
    .filter(l => l.status === 'Approved')
    .reduce((acc, curr) => acc + (curr.days || 0), 0);
  const remainingLeave = totalLeaveDays - usedLeaveDays;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      
      {/* --- HEADER: GERİ DÖN --- */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Çalışan Listesine Dön
      </button>

      {/* PROFİL KARTI */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
         
         {/* Arka Plan Süsü */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

         {/* Avatar (DÜZELTİLDİ) */}
         <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0 relative z-10">
            {employee.avatar && !imgError ? (
               <img 
                 src={employee.avatar} 
                 alt="Profile" 
                 onError={() => setImgError(true)}
                 className="w-full h-full object-cover"
               />
            ) : (
               <span className="text-4xl font-bold text-blue-600">{employee.name.charAt(0).toUpperCase()}</span>
            )}
         </div>
         
         {/* Bilgiler */}
         <div className="flex-1 space-y-4 relative z-10">
            <div>
               <h1 className="text-3xl font-bold text-gray-800">{employee.name}</h1>
               <div className="flex flex-wrap gap-2 mt-2">
                 <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-1">
                    <Briefcase className="w-3 h-3"/> {employee.position}
                 </span>
                 <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold border border-purple-100 flex items-center gap-1">
                    <User className="w-3 h-3"/> {employee.department}
                 </span>
                 <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${employee.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {employee.status === 'Active' ? 'Aktif' : 'Pasif'}
                 </span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/> {employee.email}</div>
               <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/> {employee.phone || '-'}</div>
               <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> Başlangıç: {employee.start_date || '-'}</div>
               <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> Ofis: İstanbul, TR</div>
               
               {/* 🔒 TCKN GİZLEME (Örnek TCKN alanı varsa) */}
               {isAuthorized && (
                   <div className="flex items-center gap-2 text-gray-800 font-bold border-t border-gray-200 pt-2 mt-2 md:col-span-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500"/> 
                      TCKN: {employee.tckn || '12345678901'} <span className="text-xs font-normal text-gray-400 ml-2">(Sadece Yöneticiler Görür)</span>
                   </div>
               )}
            </div>
         </div>

         {/* Hızlı İstatistikler (Sağ Taraf - GİZLİLİK AYARLI) */}
         <div className="flex flex-row md:flex-col gap-4 w-full md:w-auto relative z-10">
             
             {/* 🔒 MAAŞ KARTI (Sadece Yetkili) */}
             {isAuthorized ? (
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex-1 min-w-[150px]">
                    <p className="text-xs font-bold text-green-600 uppercase flex items-center gap-1"><CreditCard className="w-3 h-3"/> Maaş</p>
                    <p className="text-xl font-bold text-green-800">${parseInt(employee.salary).toLocaleString()}</p>
                 </div>
             ) : (
                 // Çalışanlar için boş veya alternatif kart
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 min-w-[150px] opacity-50">
                    <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Maaş</p>
                    <p className="text-sm font-bold text-gray-400 mt-1">Gizli Bilgi</p>
                 </div>
             )}

             {/* 🔒 İZİN KARTI (Sadece Yetkili) */}
             {isAuthorized ? (
                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex-1 min-w-[150px]">
                    <p className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Kalan İzin</p>
                    <p className="text-xl font-bold text-orange-800">{remainingLeave} Gün</p>
                 </div>
             ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 min-w-[150px] opacity-50">
                    <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> İzin Hakkı</p>
                    <p className="text-sm font-bold text-gray-400 mt-1">Gizli Bilgi</p>
                 </div>
             )}
         </div>
      </div>

      {/* --- TAB MENÜ --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
         <div className="flex border-b border-gray-100 overflow-x-auto">
            {/* Tabları dinamik oluşturuyoruz */}
            {[
              { id: 'overview', label: 'Genel Bakış', icon: FileText, show: true },
              { id: 'leaves', label: 'İzin Geçmişi', icon: Calendar, show: true }, // Herkes görebilir (sadece tarihleri)
              { id: 'payroll', label: 'Maaş Geçmişi', icon: CreditCard, show: isAuthorized }, // 🔒 Sadece Yetkili
              { id: 'logs', label: 'Giriş/Çıkışlar', icon: Clock, show: true },
            ].filter(t => t.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 min-w-[120px]
                  ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}
                `}
              >
                 <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
            ))}
         </div>

         <div className="p-6">
            
            {/* 1. GENEL BAKIŞ */}
            {activeTab === 'overview' && (
               <div className="text-center py-10">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText className="w-8 h-8"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Personel Özeti</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                     Bu personel sisteme <strong>{employee.start_date || 'belirsiz tarihte'}</strong> giriş yapmıştır.
                     {isAuthorized && (
                        <span> Toplam <strong>{data.leaves.filter(l => l.status === 'Approved').length}</strong> kez izin kullanmıştır.</span>
                     )}
                  </p>
               </div>
            )}

            {/* 2. İZİN GEÇMİŞİ */}
            {activeTab === 'leaves' && (
               <div className="space-y-3">
                  {data.leaves.length === 0 ? <p className="text-gray-400 text-center py-4">Kayıt yok.</p> : 
                    data.leaves.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                         <div>
                            <p className="font-bold text-gray-800">{item.leave_type}</p>
                            <p className="text-xs text-gray-500">{item.start_date} - {item.end_date}</p>
                         </div>
                         <div className="text-right">
                             {/* 🔒 Gün Sayısını Gizle (Opsiyonel, yönetici görsün diye bıraktım ama istersen kaldırabilirsin) */}
                             {isAuthorized && <p className="text-xs font-bold text-gray-500 mb-1">{item.days} Gün</p>}
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                                {item.status === 'Approved' ? 'Onaylandı' : item.status === 'Pending' ? 'Bekliyor' : 'Red'}
                             </span>
                         </div>
                      </div>
                    ))
                  }
               </div>
            )}

            {/* 3. MAAŞ GEÇMİŞİ (Zaten Tab gizli ama ekstra güvenlik) */}
            {activeTab === 'payroll' && isAuthorized && (
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500">
                        <tr>
                           <th className="p-3 rounded-l-lg">Dönem</th>
                           <th className="p-3">Brüt</th>
                           <th className="p-3">Net Ödenen</th>
                           <th className="p-3 rounded-r-lg text-right">Durum</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {data.payrolls.length === 0 ? <tr><td colSpan="4" className="text-center py-4 text-gray-400">Kayıt yok.</td></tr> :
                           data.payrolls.map(pay => (
                              <tr key={pay.id}>
                                 <td className="p-3 font-bold text-gray-700">{pay.period}</td>
                                 <td className="p-3 text-gray-500">${pay.base_salary.toLocaleString()}</td>
                                 <td className="p-3 font-bold text-green-600">${pay.net_pay.toLocaleString()}</td>
                                 <td className="p-3 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(pay.status)}`}>
                                       {pay.status === 'Paid' ? 'Ödendi' : 'Bekliyor'}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        }
                     </tbody>
                  </table>
               </div>
            )}

            {/* 4. ZAMAN LOGLARI */}
            {activeTab === 'logs' && (
               <div className="space-y-3">
                  {data.logs.length === 0 ? <p className="text-gray-400 text-center py-4">Henüz giriş çıkış yok.</p> :
                     data.logs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-bold text-gray-700 text-sm">{log.date}</span>
                           </div>
                           <div className="flex gap-4 text-sm">
                              <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {log.check_in?.slice(0,5) || '--:--'}</span>
                              <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3"/> {log.check_out?.slice(0,5) || '--:--'}</span>
                           </div>
                        </div>
                     ))
                  }
               </div>
            )}

         </div>
      </div>
    </div>
  );
}