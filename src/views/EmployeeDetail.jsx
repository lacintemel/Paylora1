import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Download,
  FileText,
  CreditCard
} from 'lucide-react';
import { payrollData } from '../data/mockData';

export default function EmployeeDetail({ employee, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Bu çalışana ait maaş geçmişini bulalım
  const employeePayrolls = payrollData.filter(p => p.employeeId === employee.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
      
      {/* --- GERİ DÖN BUTONU --- */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Listeye Dön
      </button>

      {/* --- PROFİL BAŞLIĞI (HEADER) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* Avatar */}
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white">
          {employee.avatar}
        </div>

        {/* İsim ve Ünvan */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-gray-500">{employee.position}</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {employee.department}
             </span>
             <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${employee.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {employee.status === 'Active' ? 'Aktif Çalışan' : 'İşten Ayrıldı'}
             </span>
          </div>
        </div>

        {/* Sağ Taraf: İletişim */}
        <div className="flex flex-col gap-2 text-sm text-gray-600 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
            <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> {employee.email}
            </div>
            <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> {employee.phone}
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> İstanbul, TR
            </div>
        </div>
      </div>

      {/* --- SEKMELER (TABS) --- */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {['overview', 'payroll', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Genel Bakış' : tab === 'payroll' ? 'Maaş Geçmişi' : 'Belgeler'}
            </button>
          ))}
        </nav>
      </div>

      {/* --- SEKME İÇERİKLERİ --- */}
      
      {/* 1. GENEL BAKIŞ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sol: Bilgiler */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Kişisel Bilgiler</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">TC Kimlik No</p>
                            <p className="font-medium">12345678901</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Doğum Tarihi</p>
                            <p className="font-medium">15.08.1995</p>
                        </div>
                        <div>
                            <p className="text-gray-500">İşe Başlama</p>
                            <p className="font-medium">{employee.startDate}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Maaş (Brüt)</p>
                            <p className="font-medium">${employee.salary.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sağ: İzin Durumu */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">İzin Bakiyesi</h3>
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-blue-600 mb-1">14</div>
                    <p className="text-sm text-gray-500">Kalan Gün</p>
                </div>
                <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Toplam Hak</span>
                        <span className="font-bold">20 Gün</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Kullanılan</span>
                        <span className="font-bold text-red-500">6 Gün</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. MAAŞ GEÇMİŞİ */}
      {activeTab === 'payroll' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 border-b border-gray-100">
                     <tr>
                         <th className="px-6 py-3 font-medium text-gray-600">Dönem</th>
                         <th className="px-6 py-3 font-medium text-gray-600">Brüt</th>
                         <th className="px-6 py-3 font-medium text-gray-600">Net Ödenen</th>
                         <th className="px-6 py-3 font-medium text-gray-600">Durum</th>
                         <th className="px-6 py-3 text-right">Bordro</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {employeePayrolls.length > 0 ? employeePayrolls.map(pay => (
                         <tr key={pay.id}>
                             <td className="px-6 py-4 font-medium text-gray-800">{pay.period}</td>
                             <td className="px-6 py-4 text-gray-500">${employee.salary}</td>
                             <td className="px-6 py-4 font-bold text-green-700">${pay.net}</td>
                             <td className="px-6 py-4">
                                 <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Ödendi</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <button className="text-blue-600 hover:underline flex items-center gap-1 justify-end ml-auto">
                                     <Download className="w-4 h-4" /> İndir
                                 </button>
                             </td>
                         </tr>
                     )) : (
                         <tr><td colSpan="5" className="p-6 text-center text-gray-500">Henüz maaş kaydı yok.</td></tr>
                     )}
                 </tbody>
             </table>
         </div>
      )}

      {/* 3. BELGELER */}
      {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['İş Sözleşmesi.pdf', 'Gizlilik Anlaşması.pdf', 'Kimlik Fotokopisi.jpg'].map((doc, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                              <FileText className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-gray-700">{doc}</span>
                      </div>
                      <button className="text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                  </div>
              ))}
          </div>
      )}

    </div>
  );
}