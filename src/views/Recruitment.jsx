import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // 👈 BAĞLANTI
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Briefcase, 
  Star, 
  Mail, 
  Phone, 
  Info, 
  FileText, 
  Download, 
  X 
} from 'lucide-react';

export default function Recruitment() {
  const stages = [
    { id: 'Applied', title: 'Başvuru', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
    { id: 'Screening', title: 'İnceleme', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
    { id: 'Interview', title: 'Mülakat', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
    { id: 'Offer', title: 'Teklif', color: 'bg-orange-50 text-orange-700', border: 'border-orange-200' },
    { id: 'Hired', title: 'İşe Alındı', color: 'bg-green-50 text-green-700', border: 'border-green-200' },
  ];

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAL STATE'LERİ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', role: '', stage: 'Applied', email: '', phone: '' });

  // --- 1. VERİLERİ ÇEK ---
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('id', { ascending: false }); // En yeniler üstte

    if (error) console.error("Adaylar çekilemedi:", error);
    else setCandidates(data);
    
    setLoading(false);
  };

  // --- 2. ADAY EKLE ---
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    const newCandidate = {
      name: formData.name,
      role: formData.role,
      stage: formData.stage,
      email: formData.email,
      phone: formData.phone,
      rating: 0
    };

    const { error } = await supabase.from('candidates').insert([newCandidate]);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      fetchCandidates(); // Listeyi yenile
      setIsAddModalOpen(false);
      setFormData({ name: '', role: '', stage: 'Applied', email: '', phone: '' });
    }
  };

  // --- 3. YILDIZ VER (UPDATE) ---
  const handleRatingChange = async (id, newRating) => {
    // Önce yerel (hızlı) güncelleme
    setCandidates(candidates.map(c => c.id === id ? { ...c, rating: newRating } : c));

    // Sonra veritabanı güncelleme
    await supabase
      .from('candidates')
      .update({ rating: newRating })
      .eq('id', id);
  };

  // --- 4. AŞAMA DEĞİŞTİR (TAŞIMA) ---
  const moveCandidate = async (id, direction) => {
    const candidate = candidates.find(c => c.id === id);
    const currentIndex = stages.findIndex(s => s.id === candidate.stage);
    let newIndex = currentIndex + (direction === 'next' ? 1 : -1);

    if (newIndex >= 0 && newIndex < stages.length) {
      const newStage = stages[newIndex].id;

      // Yerel güncelleme (anında tepki)
      setCandidates(candidates.map(c => c.id === id ? { ...c, stage: newStage } : c));

      // DB Güncelleme
      await supabase
        .from('candidates')
        .update({ stage: newStage })
        .eq('id', id);
    }
  };

  // Adayın Avatarını İsminden Üret (Helper)
  const getAvatar = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 relative">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">İşe Alım Panosu</h1>
          <p className="text-gray-500">Aday takip sistemi (ATS) - {candidates.length} Aday.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Aday Ekle
        </button>
      </div>

      {/* YÜKLENİYORSA */}
      {loading && (
          <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
      )}

      {/* KANBAN BOARD */}
      {!loading && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-6 min-w-[1200px]">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter(c => c.stage === stage.id);
              return (
                <div key={stage.id} className="w-1/5 flex flex-col h-full">
                  <div className={`flex justify-between p-3 rounded-t-xl border ${stage.border} ${stage.color} font-bold text-sm`}>
                    <span>{stage.title}</span><span className="bg-white/50 px-2 rounded-full text-xs">{stageCandidates.length}</span>
                  </div>
                  <div className="flex-1 bg-gray-50/50 border border-gray-200 border-t-0 rounded-b-xl p-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {stageCandidates.map((candidate) => (
                      <div key={candidate.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        
                        {/* Üst Kısım */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="font-bold text-sm text-gray-800">{candidate.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3"/> {candidate.role}</div>
                          </div>
                          <div className="text-xs bg-gradient-to-br from-gray-700 to-gray-900 text-white px-2 py-1 rounded-full font-bold">
                              {getAvatar(candidate.name)}
                          </div>
                        </div>

                        {/* İletişim Bilgileri (Kart Üzerinde Kısa Görünüm) */}
                        <div className="flex flex-col gap-1 mb-3 text-xs text-gray-500">
                          {candidate.email && <div className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0"/> {candidate.email}</div>}
                        </div>

                        {/* Yıldızlar */}
                        <div className="flex items-center gap-1 mb-3 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              onClick={() => handleRatingChange(candidate.id, star)}
                              className={`w-4 h-4 hover:scale-110 transition-transform ${star <= candidate.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>

                        {/* Butonlar (Alt Bar) */}
                        <div className="flex justify-between items-center border-t border-gray-50 pt-2 mt-2">
                          <button onClick={() => moveCandidate(candidate.id, 'prev')} disabled={stage.id==='Applied'} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 disabled:opacity-0 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                          
                          <div className="flex gap-1">
                              <button onClick={() => alert(`Mail gönderiliyor: ${candidate.email}`)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors" title="Mail Gönder"><Mail className="w-3.5 h-3.5" /></button>
                              <button onClick={() => alert(`Aranıyor: ${candidate.phone}`)} className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-1 rounded transition-colors" title="Ara"><Phone className="w-3.5 h-3.5" /></button>
                              <button 
                                  onClick={() => setSelectedCandidate(candidate)}
                                  className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors" 
                                  title="Detayları Gör"
                              >
                                  <Info className="w-3.5 h-3.5" />
                              </button>
                          </div>
                          
                          <button onClick={() => moveCandidate(candidate.id, 'next')} disabled={stage.id==='Hired'} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 disabled:opacity-0 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODALLAR --- */}

      {/* 1. YENİ ADAY EKLEME MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between mb-4 items-center"><h2 className="text-xl font-bold text-gray-800">Yeni Aday Ekle</h2><button onClick={()=>setIsAddModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button></div>
            <form onSubmit={handleAddCandidate} className="space-y-3">
                <input required placeholder="Ad Soyad" className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/>
                <input required placeholder="Pozisyon (Örn: Frontend Dev)" className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}/>
                <div className="grid grid-cols-2 gap-3">
                    <input type="email" placeholder="E-posta" className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/>
                    <input type="tel" placeholder="Telefon" className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                </div>
                <select className="w-full border border-gray-200 p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.stage} onChange={e=>setFormData({...formData, stage: e.target.value})}>
                    {stages.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADAY DETAY MODALI */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {getAvatar(selectedCandidate.name)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{selectedCandidate.name}</h2>
                            <p className="text-gray-500 flex items-center gap-1"><Briefcase className="w-4 h-4"/> {selectedCandidate.role}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedCandidate(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500"/>
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-600"/>
                            <div><p className="text-xs text-blue-500 font-medium">Email</p><p className="text-sm font-bold text-gray-800 truncate">{selectedCandidate.email || '-'}</p></div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg flex items-center gap-3">
                            <Phone className="w-5 h-5 text-green-600"/>
                            <div><p className="text-xs text-green-500 font-medium">Telefon</p><p className="text-sm font-bold text-gray-800">{selectedCandidate.phone || '-'}</p></div>
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Değerlendirme Notu</p>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-5 h-5 ${star <= selectedCandidate.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-600">({selectedCandidate.rating}/5)</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Ekli Belgeler</p>
                        <div className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded"><FileText className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Özgeçmiş (CV).pdf</p>
                                    <p className="text-xs text-gray-500">Yüklendi: Bugün</p>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-blue-600 p-2"><Download className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-4 border-t border-gray-100 text-right">
                    <span className="text-xs font-medium text-gray-500 bg-white border px-3 py-1 rounded-full">
                        Şu anki aşama: <span className="text-blue-600 font-bold">{stages.find(s=>s.id===selectedCandidate.stage)?.title}</span>
                    </span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}