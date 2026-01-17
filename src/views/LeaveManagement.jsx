import React, { useState } from 'react';
import { 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Plus, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function LeaveManagement() {
  // --- MOCK VERİLER (Başlangıç Durumu) ---
  const initialLeaves = [
    { id: 1, employee: 'Ali Yılmaz', type: 'Yıllık İzin', dates: '20-24 Oca', days: 5, status: 'Pending', avatar: 'AY', desc: 'Aile ziyareti için.' },
    { id: 2, employee: 'Ayşe Demir', type: 'Hastalık', dates: '15 Oca', days: 1, status: 'Approved', avatar: 'AD', desc: 'Grip raporlu.' },
    { id: 3, employee: 'Mehmet Kaya', type: 'Mazeret', dates: '01 Şub', days: 1, status: 'Rejected', avatar: 'MK', desc: 'Şahsi işler.' },
    { id: 4, employee: 'Zeynep Çelik', type: 'Yıllık İzin', dates: '10-17 Şub', days: 7, status: 'Pending', avatar: 'ZÇ', desc: 'Kış tatili.' },
  ];

  // --- STATE ---
  const [leaves, setLeaves] = useState(initialLeaves);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Yeni Talep Formu
  const [formData, setFormData] = useState({ type: 'Yıllık İzin', start: '', end: '', desc: '' });

  // --- İŞLEVLER ---

  // 1. Onaylama / Reddetme
  const handleStatusChange = (id, newStatus) => {
    const updatedLeaves = leaves.map(leave => 
      leave.id === id ? { ...leave, status: newStatus } : leave
    );
    setLeaves(updatedLeaves);
  };

  // 2. Yeni Talep Oluşturma
  const handleCreateRequest = (e) => {
    e.preventDefault();
    const newRequest = {
      id: leaves.length + 1,
      employee: 'Laci Temel', // Şu anki kullanıcı
      avatar: 'LT',
      type: formData.type,
      dates: `${formData.start.slice(5)} / ${formData.end.slice(5)}`, // Basit tarih formatı
      days: 3, // Hesaplama ile uğraşmamak için sabit/rastgele
      status: 'Pending',
      desc: formData.desc
    };
    setLeaves([newRequest, ...leaves]);
    setIsModalOpen(false);
    setFormData({ type: 'Yıllık İzin', start: '', end: '', desc: '' });
  };

  // 3. Filtreleme
  const filteredLeaves = filterStatus === 'All' 
    ? leaves 
    : leaves.filter(l => l.status === filterStatus);

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İzin Yönetimi</h1>
          <p className="text-gray-500">Onay bekleyen <span className="font-bold text-orange-600">{pendingCount}</span> talep var.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          İzin Talep Et
        </button>
      </div>

      {/* --- FİLTRE TABLARI --- */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Pending', 'Approved', 'Rejected'].map((stat) => (
          <button
            key={stat}
            onClick={() => setFilterStatus(stat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
          <div key={leave.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            
            {/* Kart Üstü */}
            <div className="p-6 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                  {leave.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{leave.employee}</h3>
                  <p className="text-xs text-gray-500">{leave.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                leave.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {leave.status === 'Pending' ? 'Onay Bekliyor' :
                 leave.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
              </span>
            </div>

            {/* Kart Ortası (Detaylar) */}
            <div className="px-6 py-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{leave.dates}</span>
                <span className="text-gray-400">•</span>
                <span>{leave.days} Gün</span>
              </div>
              <p className="text-sm text-gray-500 italic">"{leave.desc}"</p>
            </div>

            {/* Kart Altı (Aksiyonlar) */}
            <div className="p-4 border-t border-gray-50 mt-4 flex gap-2">
              {leave.status === 'Pending' ? (
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
              ) : (
                <div className="w-full py-2 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                  {leave.status === 'Approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  İşlem Tamamlandı
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

      {/* --- TALEP OLUŞTURMA MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni İzin Talebi</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">İzin Türü</label>
                <select 
                  className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <input 
                    type="date" 
                    required
                    className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.start}
                    onChange={(e) => setFormData({...formData, start: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Bitiş</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.end}
                    onChange={(e) => setFormData({...formData, end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Açıklama</label>
                <textarea 
                  rows="3"
                  className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Neden izin istiyorsunuz?"
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Talep Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}