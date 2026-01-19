import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  Plus, Search, MoreHorizontal, Mail, Phone, Calendar, 
  MessageSquare, X, Check, GripVertical, User
} from 'lucide-react';

// KANBAN SÜTUNLARI (Veritabanındaki 'stage' ile eşleşmeli)
const STAGES = [
  { id: 'Applied', label: 'Başvurdu', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Screening', label: 'İnceleniyor', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Interview', label: 'Görüşülüyor', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'Offer', label: 'Teklif', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'Hired', label: 'İşe Alındı', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'Rejected', label: 'Reddedildi', color: 'bg-red-50 text-red-700 border-red-200' }
];

export default function Recruitment() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState(null);

  // Form
  const [formData, setFormData] = useState({ name: '', position: '', email: '', phone: '' });

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setCandidates(data || []);
    setLoading(false);
  };

  // --- 2. SÜRÜKLE & BIRAK MANTIĞI (HTML5 API) ---
  
  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = "move";
    // Hayalet görüntü için opsiyonel ayar
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedCandidate(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Bırakmaya izin ver
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedCandidate) return;

    // 1. Önce Arayüzü Güncelle (Optimistic UI)
    const updatedList = candidates.map(c => 
       c.id === draggedCandidate.id ? { ...c, stage: targetStage } : c
    );
    setCandidates(updatedList);

    // 2. Sonra Veritabanını Güncelle
    const { error } = await supabase
       .from('candidates')
       .update({ stage: targetStage })
       .eq('id', draggedCandidate.id);

    if (error) {
       alert("Güncelleme başarısız!");
       fetchCandidates(); // Hata varsa geri al
    }
  };

  // --- 3. YENİ ADAY EKLEME ---
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('candidates').insert([{
        ...formData,
        stage: 'Applied' // Varsayılan sütun
    }]);

    if (!error) {
        setIsModalOpen(false);
        setFormData({ name: '', position: '', email: '', phone: '' });
        fetchCandidates();
    } else {
        alert("Hata: " + error.message);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İşe Alım Panosu</h1>
          <p className="text-gray-500">Adayları sürükleyerek aşamalarını güncelleyin.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
           <Plus className="w-4 h-4"/> Yeni Aday
        </button>
      </div>

      {/* KANBAN BOARD (Yatay Scroll) */}
      <div className="flex-1 overflow-x-auto pb-4">
         <div className="flex gap-6 min-w-max h-full">
            
            {STAGES.map(stage => {
                // Bu sütundaki adayları filtrele
                const stageCandidates = candidates.filter(c => c.stage === stage.id);

                return (
                   <div 
                     key={stage.id} 
                     className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200 h-full"
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, stage.id)}
                   >
                      {/* Sütun Başlığı */}
                      <div className={`p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10`}>
                         <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${stage.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                            <h3 className="font-bold text-gray-700">{stage.label}</h3>
                         </div>
                         <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">
                            {stageCandidates.length}
                         </span>
                      </div>

                      {/* Kartlar Alanı */}
                      <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                         {stageCandidates.map(candidate => (
                            <div 
                               key={candidate.id}
                               draggable
                               onDragStart={(e) => handleDragStart(e, candidate)}
                               onDragEnd={handleDragEnd}
                               className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative"
                            >
                               <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800">{candidate.name}</h4>
                                  <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <MoreHorizontal className="w-4 h-4" />
                                  </button>
                               </div>
                               <p className="text-sm text-blue-600 font-medium mb-3">{candidate.position}</p>
                               
                               <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                     <Mail className="w-3 h-3" /> {candidate.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                     <Phone className="w-3 h-3" /> {candidate.phone || '-'}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50 mt-2">
                                     <Calendar className="w-3 h-3" /> 
                                     {new Date(candidate.created_at).toLocaleDateString('tr-TR')}
                                  </div>
                               </div>
                            </div>
                         ))}
                         
                         {stageCandidates.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg opacity-50">
                               <p className="text-sm text-gray-400">Aday yok</p>
                            </div>
                         )}
                      </div>
                   </div>
                );
            })}

         </div>
      </div>

      {/* MODAL (YENİ ADAY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-xl font-bold text-gray-800">Yeni Aday Ekle</h2>
                 <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-500"/></button>
              </div>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                 <div>
                    <label className="text-sm font-bold text-gray-700">Ad Soyad</label>
                    <input required className="w-full border p-2 rounded-lg mt-1" placeholder="Ad Soyad" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-700">Pozisyon</label>
                    <input required className="w-full border p-2 rounded-lg mt-1" placeholder="Örn: Frontend Developer" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700">Email</label>
                        <input required type="email" className="w-full border p-2 rounded-lg mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700">Telefon</label>
                        <input className="w-full border p-2 rounded-lg mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-600">İptal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Kaydet</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}