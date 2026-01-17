import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // 👈 SUPABASE BAĞLANTISI
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Briefcase, 
  X, 
  Check, 
  Trash2, 
  Edit, 
  User, 
  ShieldAlert, 
  DollarSign, 
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';

export default function Employees({ onViewProfile, userRole }) {
  
  // --- STATE YÖNETİMİ ---
  const [employees, setEmployees] = useState([]); // Veritabanından gelecek
  const [loading, setLoading] = useState(true);   // Yüklenme durumu
  
  // Arama ve Filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Arayüz Kontrolleri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null); 
  
  // Düzenleme Takibi (Null ise 'Yeni Ekleme' modudur)
  const [editingId, setEditingId] = useState(null);

  // Form Verisi (SQL sütun isimleriyle uyumlu: start_date)
  const initialFormState = {
    name: '',
    position: '',
    department: 'Engineering',
    email: '',
    phone: '',
    salary: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- YETKİ KONTROLÜ ---
  const canEditStatus = ['general_manager', 'hr'].includes(userRole);

  // --- 1. SUPABASE VERİ ÇEKME (READ) ---
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: false }); // En son eklenen en üstte

    if (error) {
      console.error('Veri çekme hatası:', error);
      alert('Veriler yüklenemedi!');
    } else {
      setEmployees(data);
    }
    setLoading(false);
  };

  // --- 2. KAYDETME (CREATE & UPDATE) ---
  const handleSave = async (e) => {
    e.preventDefault();

    // İsimden baş harfleri çıkarma (Avatar için)
    const nameParts = formData.name.split(' ');
    const initials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() 
      : formData.name.slice(0, 2).toUpperCase();

    // Veritabanına gidecek paket
    const payload = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      salary: Number(formData.salary),
      status: formData.status,
      start_date: formData.start_date,
      avatar: initials
    };

    try {
      if (editingId) {
        // --- GÜNCELLEME ---
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // --- YENİ EKLEME ---
        const { error } = await supabase
          .from('employees')
          .insert([payload]);
          
        if (error) throw error;
      }
      
      // İşlem başarılıysa listeyi yenile ve modalı kapat
      await fetchEmployees();
      setIsModalOpen(false);

    } catch (error) {
      alert('İşlem sırasında hata oluştu: ' + error.message);
    }
  };

  // --- 3. SİLME (DELETE) ---
  const handleDelete = async (id) => {
    if (window.confirm('Bu çalışan kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Listeyi yerel olarak güncelle (Tekrar fetch atmaya gerek yok, daha hızlı)
        setEmployees(employees.filter(e => e.id !== id));
        setActiveMenuId(null);

      } catch (error) {
        alert('Silme hatası: ' + error.message);
      }
    }
  };

  // --- YARDIMCI FONKSİYONLAR ---

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openEditModal = (employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      position: employee.position,
      department: employee.department,
      email: employee.email,
      phone: employee.phone,
      salary: employee.salary,
      start_date: employee.start_date || new Date().toISOString().split('T')[0],
      status: employee.status
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation(); 
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- FİLTRELEME ---
  const departments = ['All', ...new Set(employees.map(emp => emp.department))];
  
  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      emp.name.toLowerCase().includes(term) || 
      emp.position.toLowerCase().includes(term);
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    
    return matchesSearch && matchesDept;
  });

  return (
    <div 
      className="space-y-8 animate-in fade-in duration-500 min-h-screen pb-20"
      onClick={() => setActiveMenuId(null)}
    >
      
      {/* --- ÜST BAŞLIK VE EKLE BUTONU --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Çalışan Yönetimi</h1>
          <p className="text-gray-500 mt-1">
            {loading 
              ? 'Veriler veritabanından yükleniyor...' 
              : `Toplam ${filteredEmployees.length} çalışan görüntüleniyor.`
            }
          </p>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            openAddModal();
          }}
          className="group bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
             <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold">Yeni Çalışan Ekle</span>
        </button>
      </div>

      {/* --- ARAMA VE FİLTRE BAR --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4" onClick={e => e.stopPropagation()}>
        
        {/* Arama Kutusu */}
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="İsim veya pozisyon ile hızlı arama..." 
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-shadow text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Departman Filtresi */}
        <div className="relative min-w-[240px]">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Filter className="w-5 h-5" />
          </div>
          <select 
            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-4 focus:ring-blue-50 bg-white cursor-pointer text-gray-700 font-medium transition-shadow"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'Tüm Departmanlar' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- YÜKLENİYOR ANİMASYONU --- */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Supabase'den veriler alınıyor...</p>
        </div>
      )}

      {/* --- ÇALIŞAN KARTLARI (GRID) --- */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div 
              key={emp.id} 
              className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${emp.status !== 'Active' 
                  ? 'border-red-100 bg-gradient-to-b from-white to-red-50/30' 
                  : 'border-gray-100 hover:border-blue-200'
                }
              `}
            >
              
              {/* Kart Üstü: Profil ve Menü */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform group-hover:scale-105
                    ${emp.status !== 'Active' 
                      ? 'bg-gray-400 grayscale' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}
                  >
                    {emp.avatar || emp.name.charAt(0)}
                  </div>
                  
                  {/* İsim ve ID */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">
                      ID: {emp.id}
                    </p>
                  </div>
                </div>
                
                {/* 3 Nokta Menüsü */}
                <div className="relative">
                  <button 
                    onClick={(e) => toggleMenu(emp.id, e)}
                    className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menü */}
                  {activeMenuId === emp.id && (
                    <div className="absolute right-0 top-10 w-40 bg-white shadow-xl rounded-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(emp);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                      >
                        <Edit className="w-4 h-4" /> Düzenle
                      </button>
                      
                      <div className="h-px bg-gray-100 my-0"></div>
                      
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Kaydı Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ayırıcı Çizgi */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent my-2"></div>

              {/* Kart Detayları */}
              <div className="p-6 py-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{emp.position}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{emp.phone}</span>
                </div>
              </div>

              {/* Kart Altı: Durum ve Maaş */}
              <div className="px-6 py-4 bg-gray-50/80 rounded-b-2xl flex items-center justify-between border-t border-gray-100">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border
                  ${emp.status === 'Active' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-red-100 text-red-700 border-red-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {emp.status === 'Active' ? 'Aktif' : 'Pasif'}
                </span>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Yıllık Maaş</p>
                  <p className="font-bold text-gray-800 font-mono text-sm">
                    ${Number(emp.salary).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Profil Görüntüle Butonu */}
              <div className="absolute inset-x-6 bottom-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                 <button 
                    onClick={() => onViewProfile && onViewProfile(emp)}
                    className="w-full py-3 text-sm font-bold text-white bg-gray-900 rounded-xl shadow-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                 >
                    <User className="w-4 h-4" /> Profili Görüntüle
                 </button>
              </div>

            </div>
          ))}
          
          {/* Sonuç Yoksa */}
          {filteredEmployees.length === 0 && (
             <div className="col-span-full py-20 text-center">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search className="w-10 h-10" />
               </div>
               <h3 className="text-lg font-bold text-gray-800">Sonuç Bulunamadı</h3>
               <p className="text-gray-500">Arama kriterlerinizi değiştirip tekrar deneyin.</p>
             </div>
          )}
        </div>
      )}

      {/* --- ADD/EDIT EMPLOYEE MODAL (TAM DETAYLI) --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? 'Çalışan Bilgilerini Düzenle' : 'Yeni Çalışan Kaydı'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Lütfen aşağıdaki bilgileri eksiksiz doldurun.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-8 space-y-6">
              
              {/* Grup: Kişisel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Kişisel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad Soyad <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        required
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pozisyon <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        required
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Örn: Senior Developer"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grup: Kurumsal Bilgiler */}
              <div className="space-y-4 pt-2">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Kurumsal Bilgiler</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Departman</label>
  <div className="relative">
    {/* SOL İKON: Bina Simgesi */}
    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
    
    <select 
      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer appearance-none" 
      value={formData.department}
      onChange={(e) => setFormData({...formData, department: e.target.value})}
    >
      <option value="Engineering">Engineering</option>
      <option value="HR">HR</option>
      <option value="Sales">Sales</option>
      <option value="Marketing">Marketing</option>
      <option value="Finance">Finance</option>
      <option value="Product">Product</option>
      <option value="Design">Design</option>
    </select>

    {/* SAĞ İKON: Aşağı Ok (appearance-none kullandığımız için bunu elle ekledik) */}
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Maaş (Yıllık)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          required
                          type="number" 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Örn: 85000"
                          value={formData.salary}
                          onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Grup: İletişim */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Adresi</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          required
                          type="email" 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="ahmet@sirket.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon Numarası</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="tel" 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="+90 555 ..."
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                   </div>
                </div>
              </div>

              {/* Grup: Durum (Hassas Alan) */}
              <div className={`bg-gray-50 p-4 rounded-xl border mt-4 ${canEditStatus ? 'border-gray-200' : 'border-red-100 bg-red-50/50'}`}>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center justify-between">
                      Çalışma Durumu
                      {!canEditStatus && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full flex items-center gap-1">
                           <ShieldAlert className="w-3 h-3"/> Değiştirme Yetkiniz Yok
                        </span>
                      )}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Çalışan işten ayrıldığında durumu 'Pasif' olarak güncelleyin. Bu işlem çalışanın sisteme girişini engeller.</p>
                  
                  <select 
                      disabled={!canEditStatus} 
                      className={`w-full px-4 py-2.5 border rounded-lg outline-none appearance-none transition-all font-medium
                        ${!canEditStatus 
                          ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed' 
                          : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 cursor-pointer'
                        }
                      `}
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                      <option value="Active">🟢 Aktif Çalışan</option>
                      <option value="Inactive">🔴 Pasif (İşten Ayrıldı / İzinli)</option>
                  </select>
              </div>

              {/* Footer */}
              <div className="pt-6 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-300 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Check className="w-5 h-5" />}
                  {editingId ? 'Değişiklikleri Kaydet' : 'Çalışanı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}