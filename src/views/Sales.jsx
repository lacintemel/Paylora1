import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  TrendingUp, Plus, Search, Loader2, Trash2, 
  Calendar, DollarSign, User, Tag, Edit3, Save, X
} from 'lucide-react';

export default function Sales({ userRole, currentUserId, currentUserName }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    employee_id: '',
    description: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  const [employees, setEmployees] = useState([]);
  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchSales();
    if (isManager) fetchEmployees();
  }, [selectedMonth]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('month', selectedMonth)
        .order('sale_date', { ascending: false });

      if (!isManager) {
        query = query.eq('created_by', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Satış verisi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Çalışanlar çekilemedi:', error);
    }
  };

  const handleAddSale = async () => {
    if (!formData.amount || !formData.category) {
      alert('Lütfen tüm zorunlu alanları doldurunuz');
      return;
    }

    try {
      const saleData = {
        ...formData,
        amount: parseFloat(formData.amount),
        month: selectedMonth,
        created_by: currentUserId,
        created_by_name: currentUserName
      };

      if (editingId) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales')
          .insert([saleData]);
        if (error) throw error;
      }

      alert(editingId ? 'Satış güncellendi' : 'Satış kaydedildi');
      setFormData({ amount: '', category: '', employee_id: '', description: '', sale_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      setIsAddModalOpen(false);
      fetchSales();
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      alert('Satış silindi');
      fetchSales();
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const handleEditSale = (sale) => {
    setFormData({
      amount: sale.amount,
      category: sale.category,
      employee_id: sale.employee_id || '',
      description: sale.description || '',
      sale_date: sale.sale_date
    });
    setEditingId(sale.id);
    setIsAddModalOpen(true);
  };

  const filteredSales = sales.filter(sale =>
    sale.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.employee_name && sale.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.description && sale.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600"/> Satış Yönetimi
          </h1>
          <p className="text-gray-500 text-sm">{selectedMonth} Dönemi</p>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold shadow-sm transition-all"
          >
            <Plus className="w-5 h-5"/> Satış Ekle
          </button>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 border rounded-xl text-sm font-bold"
          />
        </div>
      </div>

      {/* ARAMA */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Kategori, çalışan veya açıklama ara..." 
            className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400 font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ÖZETİ */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">Toplam Satış ({filteredSales.length})</p>
            <p className="text-4xl font-black text-blue-900 mt-2">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right text-sm text-blue-600 font-bold">
            <p>Ort: ${filteredSales.length > 0 ? (totalSales / filteredSales.length).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 0}</p>
          </div>
        </div>
      </div>

      {/* TABLO */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Satış kaydı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Tarih</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Kategori</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Tutar</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Satış Yapan</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide">Açıklama</th>
                    {isManager && <th className="px-6 py-4 font-bold text-gray-700 text-sm uppercase tracking-wide text-right">İşlemler</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800 text-sm">{sale.sale_date}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                          <Tag className="w-3 h-3"/> {sale.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600 text-lg">${sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.employee_name ? (
                          <span className="flex items-center gap-1"><User className="w-3 h-3"/> {sale.employee_name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Atanmamış</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sale.description || '-'}</td>
                      {isManager && (
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditSale(sale)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600"/>
                {editingId ? 'Satışı Düzenle' : 'Yeni Satış Ekle'}
              </h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                  setFormData({ amount: '', category: '', employee_id: '', description: '', sale_date: new Date().toISOString().split('T')[0] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Tarih */}
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-1 items-center gap-1">
                  <Calendar className="w-4 h-4"/> Tarih
                </label>
                <input 
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-1 items-center gap-1">
                  <Tag className="w-4 h-4"/> Kategori *
                </label>
                <input 
                  type="text"
                  placeholder="örn: Yazılım Hizmetleri, Danışmanlık, Ürün Satışı"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              {/* Tutar */}
              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-1 items-center gap-1">
                  <DollarSign className="w-4 h-4"/> Tutar ($) *
                </label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Satış Yapan (Manager için) */}
              {isManager && (
                <div>
                  <label className="flex text-sm font-bold text-gray-700 mb-1 items-center gap-1">
                    <User className="w-4 h-4"/> Satış Yapan Kişi
                  </label>
                  <select 
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                  >
                    <option value="">-- Seçim Yapınız --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
                <textarea 
                  placeholder="Satış hakkında ek bilgi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium h-20"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                  setFormData({ amount: '', category: '', employee_id: '', description: '', sale_date: new Date().toISOString().split('T')[0] });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleAddSale}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4"/>
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
