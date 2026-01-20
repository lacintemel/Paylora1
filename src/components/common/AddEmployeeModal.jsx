import React, { useState } from 'react';
import { supabase } from '../../supabase'; // Supabase yoluna dikkat (genelde ../../supabase veya ../supabase)
import { X, User, Mail, Briefcase, Building2, DollarSign, Calendar } from 'lucide-react';

export default function AddEmployeeModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee',
    department: 'Yazılım',
    position: '',
    salary: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Veritabanına Ekle
      const { error } = await supabase
        .from('employees')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            department: formData.department,
            position: formData.position,
            salary: formData.salary ? parseFloat(formData.salary) : 0,
            start_date: formData.start_date,
            status: 'Active',
            avatar: '' // Boş avatar
          }
        ]);

      if (error) throw error;

      // 2. Başarılıysa
      alert('Personel başarıyla eklendi! 🎉');
      if (onSuccess) onSuccess(); // Listeyi yenile
      onClose(); // Modalı kapat

    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        
        {/* Başlık */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Yeni Çalışan Ekle
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* İsim & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Ad Soyad</label>
              <input required name="name" onChange={handleChange} type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">E-posta</label>
              <input required name="email" onChange={handleChange} type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" placeholder="mail@sirket.com" />
            </div>
          </div>

          {/* Telefon */}
          <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Telefon</label>
              <input name="phone" onChange={handleChange} type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" placeholder="0555..." />
          </div>

          {/* Departman & Pozisyon */}
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Departman</label>
              <select name="department" onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none">
                <option>Yazılım</option>
                <option>Tasarım</option>
                <option>Pazarlama</option>
                <option>İnsan Kaynakları</option>
                <option>Yönetim</option>
                <option>Satış</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Pozisyon</label>
              <input required name="position" onChange={handleChange} type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" placeholder="Örn: Uzman" />
            </div>
          </div>

          {/* Maaş & Rol */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Maaş ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input required name="salary" onChange={handleChange} type="number" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Sistem Rolü</label>
              <select name="role" onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none">
                <option value="employee">Personel</option>
                <option value="hr">İnsan Kaynakları (HR)</option>
                <option value="general_manager">Genel Müdür</option>
              </select>
            </div>
          </div>

          {/* Başlangıç Tarihi */}
          <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">İşe Başlama Tarihi</label>
              <input required name="start_date" value={formData.start_date} onChange={handleChange} type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none" />
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 pt-4 border-t border-gray-50 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              İptal
            </button>
            <button disabled={loading} type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              {loading ? 'Ekleniyor...' : 'Kaydet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}