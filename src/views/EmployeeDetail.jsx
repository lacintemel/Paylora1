import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, CreditCard, 
  Briefcase, User, Trash2, AlertTriangle, CheckCircle, ShieldAlert, 
  FileText, XCircle, Clock 
} from 'lucide-react';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper';

// 👆 DÜZELTME: 'Clock', 'FileText' ve 'XCircle' eksiksiz eklendi.

export default function EmployeeDetail({ employee, onBack, userRole }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    leaves: [],
    payrolls: [],
    logs: []
  });
  
  const [deleteStatus, setDeleteStatus] = useState(null); // 'none', 'pending'
  const [imgError, setImgError] = useState(false);

  // Yetki Kontrolü
  const isAuthorized = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    if (employee?.id) {
        fetchEmployeeHistory();
        checkDeleteRequest();
    }
  }, [employee]);

  // Silme Talebi Kontrolü (Sadece 'Pending' olanları arıyoruz)
  const checkDeleteRequest = async () => {
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('target_employee_id', employee.id)
      .eq('status', 'Pending') 
      .single();
    
    if (data) setDeleteStatus('pending');
    else setDeleteStatus('none');
  };

  const fetchEmployeeHistory = async () => {
    setLoading(true);
    try {
      // 1. İzin Geçmişi
      const { data: leaves } = await supabase.from('leave_requests').select('*').eq('employee_id', employee.id).order('created_at', { ascending: false });
      
      // 2. Maaş Geçmişi
      let payrolls = [];
      if (isAuthorized) {
        const { data: payrollData } = await supabase.from('payrolls').select('*').eq('employee_id', employee.id).order('period', { ascending: false });
        payrolls = payrollData || [];
      }
      
      // 3. Zaman Logları
      const { data: logs } = await supabase.from('time_logs').select('*').eq('employee_id', employee.id).order('date', { ascending: false }).limit(10);

      setData({ leaves: leaves || [], payrolls: payrolls, logs: logs || [] });

    } catch (error) {
      console.error("Detay verisi hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- AKSİYONLAR ----------------

  // 1. HR: Silme Talebi Gönder
  const handleRequestDelete = async () => {
    if (!confirm(`${employee.name} için silme onayı isteyeceksiniz. Emin misiniz?`)) return;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Oturum açmış kullanıcı bulunamadı.");

        const { data: requesterEmployee, error: findError } = await supabase
            .from('employees')
            .select('id')
            .eq('email', user.email)
            .single();

        if (findError || !requesterEmployee) {
            throw new Error(`Sistemde '${user.email}' mailiyle eşleşen çalışan kaydı yok.`);
        }

        const { error } = await supabase.from('deletion_requests').insert({
            target_employee_id: employee.id,
            requester_id: requesterEmployee.id,
            status: 'Pending'
        });

        if (error) throw error;
        alert('Silme talebi Genel Müdüre iletildi.');
        setDeleteStatus('pending');

    } catch (error) {
        alert('HATA: ' + error.message);
    }
  };

  // 2. HR: Talebi İptal Et (Vazgeç)
  const handleCancelRequest = async () => {
      if(!confirm("Silme talebini geri çekmek istiyor musunuz?")) return;

      const { error } = await supabase
        .from('deletion_requests')
        .delete()
        .eq('target_employee_id', employee.id)
        .eq('status', 'Pending');

      if (!error) {
          alert("Talep geri çekildi.");
          setDeleteStatus('none');
      }
  };

  // 3. GM: Talebi Reddet
  const handleRejectRequest = async () => {
      if(!confirm("Silme talebini reddetmek istiyor musunuz? Personel silinmeyecek.")) return;

      const { error } = await supabase
        .from('deletion_requests')
        .update({ status: 'Rejected' })
        .eq('target_employee_id', employee.id)
        .eq('status', 'Pending');

      if (!error) {
          alert("Talep reddedildi. Personel aktif kalıyor.");
          setDeleteStatus('none');
      }
  };

  // 4. GM: Talebi Onayla ve Sil
  const handleApproveDelete = async () => {
    if (!confirm(`ONAYLIYOR MUSUNUZ? ${employee.name} kalıcı olarak silinecek.`)) return;

    const { error: delError } = await supabase.from('employees').delete().eq('id', employee.id);

    if (delError) {
        alert('Silme başarısız: ' + delError.message);
    } else {
        await supabase.from('deletion_requests').update({ status: 'Approved' }).eq('target_employee_id', employee.id);
        alert('Çalışan başarıyla silindi.');
        onBack(); 
    }
  };

  // 5. GM: Direkt Silme (Talep yoksa)
  const handleDirectDelete = async () => {
      if (!confirm(`DİKKAT! ${employee.name} kalıcı olarak silinecek. Onaylıyor musunuz?`)) return;
      await supabase.from('deletion_requests').delete().eq('target_employee_id', employee.id);
      const { error } = await supabase.from('employees').delete().eq('id', employee.id);
      if (error) alert('Silme hatası: ' + error.message);
      else {
          alert('Personel başarıyla silindi.');
          onBack();
      }
  };

  // ---------------- RENDERING ----------------

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': case 'Paid': return 'bg-green-100 text-green-700';
      case 'Pending': case 'Processing': return 'bg-orange-100 text-orange-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalLeaveDays = 14; 
  const usedLeaveDays = data.leaves.filter(l => l.status === 'Approved').reduce((acc, curr) => acc + (curr.days || 0), 0);
  const remainingLeave = totalLeaveDays - usedLeaveDays;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      
      {/* HEADER: GERİ DÖN */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Çalışan Listesine Dön
        </button>
      </div>

      {/* GM İÇİN TALEP UYARISI KUTUSU */}
      {deleteStatus === 'pending' && userRole === 'general_manager' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                      <h4 className="text-red-800 font-bold">Silme Talebi Mevcut</h4>
                      <p className="text-red-600 text-sm">HR departmanı bu personelin silinmesini talep etti.</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  {/* REDDET BUTONU */}
                  <button onClick={handleRejectRequest} className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                     Reddet
                  </button>
                  <button onClick={handleApproveDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
                     Onayla ve Sil
                  </button>
              </div>
          </div>
      )}

      {/* PROFİL KARTI */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

         <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0 relative z-10">
            {isValidImageUrl(employee.avatar) && !imgError ? (
               <img src={employee.avatar} alt="Profile" onError={() => setImgError(true)} className="w-full h-full object-cover"/>
            ) : (
               <span className="text-4xl font-bold text-blue-600">{getInitials(employee.name)}</span>
            )}
         </div>
         
         <div className="flex-1 space-y-4 relative z-10 w-full">
            <div className="flex justify-between items-start">
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

                {/* AKSİYON BUTONLARI (SAĞ ÜST) */}
                <div className="flex flex-col gap-2 items-end">
                    
                    {/* HR: TALEP OLUŞTUR */}
                    {userRole === 'hr' && deleteStatus === 'none' && (
                        <button onClick={handleRequestDelete} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" /> Silme Talebi
                        </button>
                    )}

                    {/* GM: DİREKT SİLME */}
                    {userRole === 'general_manager' && deleteStatus === 'none' && (
                        <button onClick={handleDirectDelete} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" /> Personeli Sil
                        </button>
                    )}

                    {/* HR: TALEBİ GÖR VE İPTAL ET */}
                    {userRole === 'hr' && deleteStatus === 'pending' && (
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold border border-orange-100 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3"/> Onay Bekliyor
                            </span>
                            {/* İPTAL ET BUTONU */}
                            <button onClick={handleCancelRequest} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-lg transition-colors" title="Talebi Geri Çek">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
               <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/> {employee.email}</div>
               <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/> {employee.phone || '-'}</div>
               <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> Başlangıç: {employee.start_date || '-'}</div>
               <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> Ofis: İstanbul, TR</div>
               
               {isAuthorized && (
                   <div className="flex items-center gap-2 text-gray-800 font-bold border-t border-gray-200 pt-2 mt-2 md:col-span-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500"/> 
                      TCKN: {employee.tckn || '12345678901'} <span className="text-xs font-normal text-gray-400 ml-2">(Sadece Yöneticiler Görür)</span>
                   </div>
               )}
            </div>
         </div>

         {/* SAĞ KARTLAR (Maaş & İzin) */}
         <div className="flex flex-row md:flex-col gap-4 w-full md:w-auto relative z-10">
             {isAuthorized ? (
                 <>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex-1 min-w-[150px]">
                        <p className="text-xs font-bold text-green-600 uppercase flex items-center gap-1"><CreditCard className="w-3 h-3"/> Maaş</p>
                        <p className="text-xl font-bold text-green-800">${parseInt(employee.salary).toLocaleString()}</p>
                    </div>
                    {/* 👇 'Clock' ikonu burada kullanılıyor */}
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex-1 min-w-[150px]">
                        <p className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Kalan İzin</p>
                        <p className="text-xl font-bold text-orange-800">{remainingLeave} Gün</p>
                    </div>
                 </>
             ) : (
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 min-w-[150px] opacity-50">
                    <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Gizli Bilgi</p>
                    <p className="text-sm font-bold text-gray-400 mt-1">Yetkiniz Yok</p>
                 </div>
             )}
         </div>
      </div>

      {/* --- TAB MENÜ --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
         <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: FileText, show: true },
                     { id: 'leaves', label: 'İzin Geçmişi', icon: Calendar, show: userRole !== 'employee' },
              { id: 'payroll', label: 'Maaş Geçmişi', icon: CreditCard, show: isAuthorized },
                     { id: 'logs', label: 'Giriş/Çıkışlar', icon: Clock, show: userRole !== 'employee' },
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
            {activeTab === 'overview' && (
               <div className="text-center py-10">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText className="w-8 h-8"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Personel Özeti</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                     Bu personel sisteme <strong>{employee.start_date || 'belirsiz tarihte'}</strong> giriş yapmıştır.
                  </p>
               </div>
            )}

            {activeTab === 'leaves' && (
               <div className="space-y-3">
                  {data.leaves.length === 0 ? <p className="text-gray-400 text-center py-4">Kayıt yok.</p> : 
                    data.leaves.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                         <div>
                            <p className="font-bold text-gray-800">{item.leave_type}</p>
                            <p className="text-xs text-gray-500">{item.start_date} - {item.end_date}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                            {item.status === 'Approved' ? 'Onaylandı' : item.status === 'Pending' ? 'Bekliyor' : 'Red'}
                         </span>
                      </div>
                    ))
                  }
               </div>
            )}

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