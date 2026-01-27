import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  TrendingUp, Plus, Search, Trash2, Edit3, X, 
  DollarSign, Calendar, User, Package, Loader2, Save
} from 'lucide-react';

export default function Sales({ currentUserId, userRole }) {
  const [sales, setSales] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  const [formData, setFormData] = useState({
    product_name: '',
    amount: '',
    sale_date: new Date().toISOString().split('T')[0],
    employee_id: '',
    notes: ''
  });

  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchSales();
    fetchEmployees();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          employee:employees!sales_employee_id_fkey(id, name),
          creator:employees!sales_created_by_fkey(id, name)
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Satışlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, position')
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Çalışanlar yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const saleData = {
        product_name: formData.product_name,
        amount: parseFloat(formData.amount),
        sale_date: formData.sale_date,
        employee_id: formData.employee_id || null,
        notes: formData.notes || null,
        created_by: currentUserId
      };

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id);

        if (error) throw error;
        alert('Satış güncellendi! ✅');
      } else {
        const { error } = await supabase
          .from('sales')
          .insert([saleData]);

        if (error) throw error;
        alert('Satış eklendi! ✅');
      }

      fetchSales();
      closeModal();
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu satışı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Satış silindi! ✅');
      fetchSales();
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const openModal = (sale = null) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        product_name: sale.product_name,
        amount: sale.amount,
        sale_date: sale.sale_date,
        employee_id: sale.employee_id || '',
        notes: sale.notes || ''
      });
    } else {
      setEditingSale(null);
      setFormData({
        product_name: '',
        amount: '',
        sale_date: new Date().toISOString().split('T')[0],
        employee_id: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    setFormData({
      product_name: '',
      amount: '',
      sale_date: new Date().toISOString().split('T')[0],
      employee_id: '',
      notes: ''
    });
  };

  const filteredSales = sales.filter(sale =>
    sale.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  const thisMonthSales = sales
    .filter(s => s.sale_date?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, sale) => sum + (sale.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600"/> Satış Yönetimi
          </h1>
          <p className="text-gray-500">Şirket satışlarını ve performansını takip edin.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-700 font-bold shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" /> Yeni Satış Ekle
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Toplam Satış</p>
              <p className="text-3xl font-black mt-2">${totalSales.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200 opacity-50"/>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Bu Ay</p>
              <p className="text-3xl font-black mt-2">${thisMonthSales.toLocaleString()}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-200 opacity-50"/>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Toplam İşlem</p>
              <p className="text-3xl font-black mt-2">{sales.length}</p>
            </div>
            <Package className="w-12 h-12 text-purple-200 opacity-50"/>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"/>
          <input 
            type="text"
            placeholder="Ürün/Hizmet veya çalışan ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Ürün/Hizmet</th>
                <th className="px-6 py-4 font-bold">Tutar</th>
                <th className="px-6 py-4 font-bold">Tarih</th>
                <th className="px-6 py-4 font-bold">Sorumlu Çalışan</th>
                <th className="px-6 py-4 font-bold">Ekleyen</th>
                <th className="px-6 py-4 font-bold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Henüz satış kaydı yok.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{sale.product_name}</div>
                      {sale.notes && <div className="text-xs text-gray-500 mt-1">{sale.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600 text-lg">
                        ${sale.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.sale_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      {sale.employee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {sale.employee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{sale.employee.name}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sale.creator?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(sale)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4"/>
                        </button>
                        {isManager && (
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSale ? 'Satış Düzenle' : 'Yeni Satış Ekle'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ürün/Hizmet Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500"
                  placeholder="Örn: Proje Danışmanlığı, Ürün Satışı..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Satış Tutarı ($) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Satış Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.sale_date}
                  onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Sorumlu Çalışan (Opsiyonel)
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500"
                >
                  <option value="">Seçilmedi</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Bu satışı gerçekleştiren veya katkıda bulunan çalışanı seçin.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500 h-20"
                  placeholder="Ek bilgiler..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {editingSale ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
