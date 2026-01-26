import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { Search, UserPlus, Info, Mail, Phone, Building2 } from 'lucide-react';
// 👇 Modal bileşenini import etmeyi unutma (Dosya yolu senin yapına göre değişebilir)
import AddEmployeeModal from '../components/common/AddEmployeeModal';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper'; 

export default function Employees({ onViewProfile, userRole }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 👇 Modalın açık/kapalı durumu
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Çalışanlar çekilemedi:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Arama Filtresi
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔒 YETKİ KONTROLÜ
  const isAuthorized = ['general_manager', 'hr'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       
       {/* BAŞLIK VE AKSİYONLAR */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Çalışanlar</h1>
            <p className="text-gray-500">Şirket organizasyonu ve takım arkadaşlarınız.</p>
         </div>
         
         {/* Sadece Yetkililer Ekleme Yapar */}
         {isAuthorized && (
            <button 
                onClick={() => setIsAddModalOpen(true)} // 👈 ARTIK MODAL AÇIYOR
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm transition-all hover:shadow-md"
            >
                <UserPlus className="w-5 h-5" /> Yeni Çalışan Ekle
            </button>
         )}
       </div>

       {/* ARAMA ÇUBUĞU */}
       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
             <Search className="w-5 h-5 text-gray-400" />
             <input 
               type="text" 
               placeholder="İsim, departman veya unvan ara..." 
               className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400 font-medium" 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       {/* LİSTE */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                <tr>
                   <th className="px-6 py-4 font-bold">Çalışan</th>
                   <th className="px-6 py-4 font-bold">Departman</th>
                   <th className="px-6 py-4 font-bold">İletişim</th>
                   <th className="px-6 py-4 font-bold">Durum</th>
                   {isAuthorized && <th className="px-6 py-4 font-bold">Maaş</th>}
                   <th className="px-6 py-4 font-bold text-right">Detay</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={isAuthorized ? 6 : 5} className="p-8 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                    <tr><td colSpan={isAuthorized ? 6 : 5} className="p-8 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                ) : (
                    filteredEmployees.map((emp) => (
                    <tr 
                        key={emp.id} 
                        // Satıra tıklayınca da detaya gitsin (Opsiyonel)
                        onClick={() => onViewProfile(emp)} 
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                        {/* İsim & Avatar */}
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold shadow-sm border border-white text-xs">
                                    {isValidImageUrl(emp.avatar) ? <img src={emp.avatar} alt={emp.name} className="w-full h-full rounded-full object-cover"/> : getInitials(emp.name)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{emp.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{emp.position}</p>
                                </div>
                            </div>
                        </td>

                        {/* Departman */}
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <Building2 className="w-3 h-3"/> {emp.department}
                            </span>
                        </td>

                        {/* İletişim */}
                        <td className="px-6 py-4 text-gray-500">
                            <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-2 text-xs font-medium hover:text-blue-600 transition-colors"><Mail className="w-3.5 h-3.5"/> {emp.email}</span>
                                <span className="flex items-center gap-2 text-xs font-medium"><Phone className="w-3.5 h-3.5"/> {emp.phone || '-'}</span>
                            </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                emp.status === 'Active' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                                {emp.status === 'Active' ? 'Aktif' : 'Pasif'}
                            </span>
                        </td>
                        
                        {/* Maaş */}
                        {isAuthorized && (
                            <td className="px-6 py-4 font-bold text-gray-700 tabular-nums">
                                ${parseInt(emp.salary).toLocaleString()}
                            </td>
                        )}

                        {/* 👇 BURAYI DEĞİŞTİRDİK: INFO İKONU */}
                        <td className="px-6 py-4 text-right">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Satır tıklamasını engelle
                                    onViewProfile(emp);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all ml-auto"
                                title="Detayları Gör"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                    ))
                )}
             </tbody>
          </table>
       </div>

       {/* 👇 MODAL BİLEŞENİ EKLENDİ */}
       {isAddModalOpen && (
        <AddEmployeeModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
             setIsAddModalOpen(false);
             fetchEmployees(); // Ekleme bitince listeyi yenile
          }} 
        />
      )}

    </div>
  );
}