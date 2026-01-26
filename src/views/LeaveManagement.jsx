import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  Calendar, Check, X, Clock, Plus, Filter, CheckCircle, XCircle, Loader2, 
  Edit2, Trash2, Save // 👇 Yeni ikonlar eklendi
} from 'lucide-react';
import { getInitials } from '../utils/avatarHelper';

export default function LeaveManagement({ currentUserId, userRole }) {
  // --- STATE ---
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Talep Oluşturma Modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ type: 'Yıllık İzin', start: '', end: '', desc: '' });

  // 👇 DÜZENLEME İÇİN YENİ STATE'LER
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null); // Düzenlenen veriyi tutar

  // YÖNETİCİ KONTROLÜ
  const isManager = ['hr', 'general_manager'].includes(userRole);

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    if (currentUserId) fetchLeaves();
  }, [currentUserId, userRole]);

  const fetchLeaves = async () => {
    setLoading(true);
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        employees ( name, avatar ) 
      `) 
      .order('created_at', { ascending: false });

    if (!isManager) {
      query = query.eq('employee_id', currentUserId);
    }

    const { data, error } = await query;
    if (error) console.error("Hata:", error);
    else setLeaves(data || []);
    
    setLoading(false);
  };

  // --- 2. DURUM GÜNCELLEME (HIZLI ONAY/RED) ---
  const handleStatusChange = async (id, newStatus) => {
    // Optimistik güncelleme
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));

    const { error } = await supabase
      .from('leave_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
        alert("Güncelleme başarısız!");
        fetchLeaves(); 
    }
  };

  // --- 3. YENİ TALEP OLUŞTURMA ---
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('leave_requests').insert([{
      employee_id: currentUserId,
      leave_type: formData.type,
      start_date: formData.start,
      end_date: formData.end,
      reason: formData.desc,
      status: 'Pending'
    }]);

    if (error) {
      alert('Hata: ' + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ type: 'Yıllık İzin', start: '', end: '', desc: '' });
      fetchLeaves();
    }
    setSubmitting(false);
  };

  // --- 4. 👇 YENİ: KAYIT SİLME ---
  const handleDeleteRequest = async (id) => {
      if(!confirm("Bu izin kaydını tamamen silmek istediğinize emin misiniz?")) return;
      
      const { error } = await supabase.from('leave_requests').delete().eq('id', id);
      
      if(error) alert("Silme hatası: " + error.message);
      else fetchLeaves();
  };

  // --- 5. 👇 YENİ: DÜZENLEME MODALINI AÇ ---
  const openEditModal = (leave) => {
      setEditingData({
          id: leave.id,
          leave_type: leave.leave_type,
          start_date: leave.start_date,
          end_date: leave.end_date,
          reason: leave.reason,
          status: leave.status,
          employee_name: leave.employees?.name // Başlıkta göstermek için
      });
      setIsEditModalOpen(true);
  };

  // --- 6. 👇 YENİ: DÜZENLEMEYİ KAYDET ---
  const handleUpdateRequest = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      const { error } = await supabase.from('leave_requests').update({
          leave_type: editingData.leave_type,
          start_date: editingData.start_date,
          end_date: editingData.end_date,
          reason: editingData.reason,
          status: editingData.status // Yönetici statüyü de değiştirebilir
      }).eq('id', editingData.id);

      if (error) {
          alert('Güncelleme hatası: ' + error.message);
      } else {
          alert('Kayıt güncellendi! ✅');
          setIsEditModalOpen(false);
          setEditingData(null);
          fetchLeaves();
      }
      setSubmitting(false);
  };


  // --- FİLTRELEME VE HESAPLAMA ---
  const filteredLeaves = filterStatus === 'All' 
    ? leaves 
    : leaves.filter(l => l.status === filterStatus);

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  const getAvatarContent = (leave) => {
    const emp = leave.employees; 
    if (emp?.avatar && emp.avatar.startsWith('http')) {
        return <img src={emp.avatar} alt="Avatar" className="w-full h-full object-cover" />;
    }
    return getInitials(emp?.name || 'Bilinmiyor');
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İzin Yönetimi</h1>
          <p className="text-gray-500">
             {isManager 
               ? <span>Onay bekleyen <span className="font-bold text-orange-600">{pendingCount}</span> talep var.</span> 
               : 'İzin taleplerini buradan takip edebilirsin.'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> İzin Talep Et
        </button>
      </div>

      {/* --- FİLTRE TABLARI --- */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Pending', 'Approved', 'Rejected'].map((stat) => (
          <button
            key={stat}
            onClick={() => setFilterStatus(stat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === stat 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {stat === 'All' ? 'Tümü' : 
             stat === 'Pending' ? 'Bekleyenler' : 
             stat === 'Approved' ? 'Onaylananlar' : 'Reddedilenler'}
          </button>
        ))}
      </div>

      {/* --- İZİN KARTLARI LİSTESİ --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeaves.map((leave) => (
          <div key={leave.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
            
            {/* Kart Üstü */}
            <div className="p-6 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden border border-white shadow-sm">
                  {getAvatarContent(leave)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{leave.employees?.name || 'Bilinmiyor'}</h3>
                  <p className="text-xs text-gray-500">{leave.leave_type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                leave.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {leave.status === 'Pending' ? 'Bekliyor' :
                 leave.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
              </span>
            </div>

            {/* Kart Ortası */}
            <div className="px-6 py-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                    {new Date(leave.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(leave.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-gray-400">•</span>
                <span>{calculateDays(leave.start_date, leave.end_date)} Gün</span>
              </div>
              <p className="text-sm text-gray-500 italic truncate">"{leave.reason}"</p>
            </div>

            {/* Kart Altı: AKSİYON BUTONLARI */}
            <div className="p-4 border-t border-gray-50 mt-4 flex items-center gap-2">
              
              {/* Yönetici ve Bekleyen Talep ise: Hızlı Onay/Red Butonları */}
              {isManager && leave.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleStatusChange(leave.id, 'Approved')}
                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Onayla
                  </button>
                  <button 
                    onClick={() => handleStatusChange(leave.id, 'Rejected')}
                    className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reddet
                  </button>
                </>
              )}

              {/* Yönetici Değilse veya Beklemede Değilse: Durum Bilgisi */}
              {(!isManager || leave.status !== 'Pending') && (
                 <div className="flex-1 text-sm text-gray-400 flex items-center gap-2">
                    {leave.status === 'Approved' ? <CheckCircle className="w-4 h-4 text-green-500" /> : 
                     leave.status === 'Rejected' ? <XCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4" />}
                    {leave.status === 'Pending' ? 'Onay Bekleniyor' : 'İşlem Tamamlandı'}
                 </div>
              )}

              {/* 👇 YENİ: DÜZENLE VE SİL BUTONLARI (Sadece Yönetici Görür) */}
              {isManager && (
                  <div className="flex items-center gap-1 border-l pl-2 border-gray-200">
                      <button onClick={() => openEditModal(leave)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                          <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRequest(leave.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Sil">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              )}
            </div>
          </div>
        ))}

        {filteredLeaves.length === 0 && (
           <div className="col-span-full py-12 text-center text-gray-400">
             <Filter className="w-12 h-12 mx-auto mb-2 opacity-20" />
             <p>Bu kategoride izin talebi yok.</p>
           </div>
        )}
      </div>

      {/* --- TALEP OLUŞTURMA MODALI (ESKİSİ GİBİ) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni İzin Talebi</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">İzin Türü</label>
                <select 
                  className="w-full border rounded-lg p-2 mt-1 bg-white"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option>Yıllık İzin</option>
                  <option>Hastalık İzni</option>
                  <option>Mazeret İzni</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Başlangıç</label>
                  <input type="date" required className="w-full border rounded-lg p-2 mt-1" value={formData.start} onChange={(e) => setFormData({...formData, start: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Bitiş</label>
                  <input type="date" required className="w-full border rounded-lg p-2 mt-1" value={formData.end} onChange={(e) => setFormData({...formData, end: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Açıklama</label>
                <textarea rows="3" className="w-full border rounded-lg p-2 mt-1" placeholder="Neden izin istiyorsunuz?" value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">İptal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />} Talep Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 👇 YENİ: DÜZENLEME MODALI --- */}
      {isEditModalOpen && editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-blue-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">İzni Düzenle</h2>
                    <p className="text-xs text-blue-600 font-medium">{editingData.employee_name}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
            </div>
            
            <form onSubmit={handleUpdateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700">İzin Türü</label>
                    <select 
                      className="w-full border rounded-lg p-2 mt-1 bg-white"
                      value={editingData.leave_type}
                      onChange={(e) => setEditingData({...editingData, leave_type: e.target.value})}
                    >
                      <option>Yıllık İzin</option>
                      <option>Hastalık İzni</option>
                      <option>Mazeret İzni</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Durum</label>
                    <select 
                      className="w-full border rounded-lg p-2 mt-1 bg-white font-bold text-gray-700"
                      value={editingData.status}
                      onChange={(e) => setEditingData({...editingData, status: e.target.value})}
                    >
                      <option value="Pending">Bekliyor</option>
                      <option value="Approved">Onaylandı</option>
                      <option value="Rejected">Reddedildi</option>
                    </select>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Başlangıç</label>
                  <input 
                    type="date" required className="w-full border rounded-lg p-2 mt-1" 
                    value={editingData.start_date} onChange={(e) => setEditingData({...editingData, start_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Bitiş</label>
                  <input 
                    type="date" required className="w-full border rounded-lg p-2 mt-1" 
                    value={editingData.end_date} onChange={(e) => setEditingData({...editingData, end_date: e.target.value})} 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700">Açıklama</label>
                <textarea 
                  rows="3" className="w-full border rounded-lg p-2 mt-1" 
                  value={editingData.reason} onChange={(e) => setEditingData({...editingData, reason: e.target.value})}
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">İptal</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4"/>} 
                    Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}