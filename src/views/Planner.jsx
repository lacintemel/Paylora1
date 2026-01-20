import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Plus, X, User, DollarSign, Briefcase, 
  Users, CornerDownLeft, Trash2, Edit2, AlertTriangle, Check
} from 'lucide-react';

export default function Planner({ userRole, currentUserId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE YÖNETİMİ ---
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDragConfirmOpen, setIsDragConfirmOpen] = useState(false);

  // Veriler
  const [myProfile, setMyProfile] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  
  // Seçili / Sürüklenen Etkinlikler
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dropTargetDate, setDropTargetDate] = useState(null);

  // Form Verisi
  const [newEvent, setNewEvent] = useState({
    title: '', type: 'Meeting', start_time: '09:00', description: '', target_audience: 'Company', target_id: ''
  });

  const isManager = ['general_manager', 'hr'].includes(userRole);
  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Product'];

  // --- BAŞLANGIÇ ---
  useEffect(() => {
    if (currentUserId) {
        fetchMyProfile();
        fetchEmployeesList();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (myProfile) fetchAllEvents();
  }, [currentDate, myProfile]);

  const fetchMyProfile = async () => {
    const { data } = await supabase.from('employees').select('*').eq('id', currentUserId).single();
    setMyProfile(data);
  };

  const fetchEmployeesList = async () => {
    const { data } = await supabase.from('employees').select('id, name, department');
    setAllEmployees(data || []);
  };

  // --- ETKİNLİKLERİ GETİR ---
  const fetchAllEvents = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    try {
      // 1. İzinler
      let leaveQuery = supabase.from('leave_requests').select(`*, employees(name)`).eq('status', 'Approved');
      if (!isManager) leaveQuery = leaveQuery.eq('employee_id', currentUserId);
      const { data: leaves } = await leaveQuery;

      // 2. Takvim Etkinlikleri (Sadece iptal edilmemişleri veya hepsini çek)
      const { data: calendarEvents } = await supabase.from('calendar_events').select('*')
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
        .neq('status', 'Cancelled'); // İptal edilenleri gösterme

      // A) İzinler
      const formattedLeaves = (leaves || []).map(l => ({
            id: `leave-${l.id}`,
            originalId: l.id,
            date: l.start_date.split('T')[0],
            title: `${l.employees?.name?.split(' ')[0]} - İzinli`,
            type: 'Leave',
            color: 'bg-orange-50 text-orange-700 border-orange-100 opacity-70',
            isDraggable: false // İzinler sürüklenemez
      }));

      // B) Etkinlikler
      const formattedEvents = (calendarEvents || []).filter(evt => {
         if (isManager) return true;
         if (evt.type === 'Payroll_Reminder') return true; 
         if (!evt.department && !evt.employee_id) return true;
         if (evt.department === myProfile.department) return true;
         if (evt.employee_id === currentUserId) return true;
         return false;
      }).map(e => ({
        id: `event-${e.id}`,
        originalId: e.id, // Veritabanı ID'si
        date: e.start_date.split('T')[0],
        title: e.title,
        description: e.description,
        time: e.start_date.split('T')[1].slice(0,5),
        type: e.type,
        color: getEventColor(e.type),
        isDraggable: isManager // Sadece yöneticiler sürükleyebilir
      }));

      setEvents([...formattedLeaves, ...formattedEvents]);

    } catch (error) {
      console.error("Takvim hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (type) => {
      switch(type) {
          case 'Meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Payroll_Reminder': return 'bg-green-100 text-green-700 border-green-200 border-l-4 border-l-green-600';
          case 'Task': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
          case 'Deadline': return 'bg-red-50 text-red-700 border-red-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  // --- CRUD İŞLEMLERİ ---

  // 1. Yeni Ekle
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      const fullDate = `${selectedDay}T${newEvent.start_time}:00`;
      let empId = null, dept = null;
      if (newEvent.target_audience === 'Person') empId = newEvent.target_id;
      if (newEvent.target_audience === 'Department') dept = newEvent.target_id;

      const { error } = await supabase.from('calendar_events').insert({
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        start_date: fullDate,
        employee_id: empId,
        department: dept,
        status: 'Active'
      });

      if (error) throw error;
      
      alert("Eklendi! ✅");
      setIsAddModalOpen(false);
      fetchAllEvents();
      setNewEvent({ title: '', type: 'Meeting', start_time: '09:00', description: '', target_audience: 'Company', target_id: '' });

    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  // 2. Güncelle (Tarih/Saat/Başlık)
  const handleUpdateEvent = async () => {
    if(!selectedEvent) return;
    // selectedEvent içindeki veriyi kullanacağız (Modal inputlarından güncellenmiş hali)
    const fullDate = `${selectedEvent.date}T${selectedEvent.time}:00`;

    const { error } = await supabase
        .from('calendar_events')
        .update({
            title: selectedEvent.title,
            description: selectedEvent.description,
            start_date: fullDate
        })
        .eq('id', selectedEvent.originalId);

    if(!error) {
        alert("Güncellendi!");
        setIsDetailModalOpen(false);
        fetchAllEvents();
    }
  };

  // 3. İptal Et (Silme)
  const handleCancelEvent = async () => {
      if(!confirm("Bu etkinliği iptal etmek istediğinize emin misiniz?")) return;
      
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'Cancelled' })
        .eq('id', selectedEvent.originalId);

      if(!error) {
          setIsDetailModalOpen(false);
          fetchAllEvents();
      }
  };

  // --- DRAG & DROP MANTIĞI ---
  const handleDragStart = (e, event) => {
    if(!event.isDraggable) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Drop işlemine izin ver
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    if (draggedEvent && dateStr !== draggedEvent.date) {
        setDropTargetDate(dateStr);
        setIsDragConfirmOpen(true); // Onay modalını aç
    }
  };

  const confirmDrop = async () => {
      // Tarihi güncelle
      const oldTime = draggedEvent.time; // Saati koru
      const newFullDate = `${dropTargetDate}T${oldTime}:00`;

      const { error } = await supabase
        .from('calendar_events')
        .update({ start_date: newFullDate })
        .eq('id', draggedEvent.originalId);

      if(!error) {
          fetchAllEvents();
          setDraggedEvent(null);
          setIsDragConfirmOpen(false);
      } else {
          alert("Taşıma sırasında hata oluştu.");
      }
  };

  // --- TAKVİM MATEMATİĞİ ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const startingSlot = firstDay === 0 ? 6 : firstDay - 1; 
  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startingSlot + 1;
    return (dayNum > 0 && dayNum <= daysInMonth) ? dayNum : null;
  });
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <CalIcon className="w-6 h-6 text-blue-600"/> Kurumsal Ajanda
           </h1>
           <p className="text-gray-500 text-sm">
               Takvimi yönetmek için tıklayın veya etkinlikleri sürükleyin.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-md transition-shadow"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
              <span className="px-4 font-bold text-gray-800 min-w-[140px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-md transition-shadow"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
           </div>
           
           {isManager && (
               <button onClick={() => { setSelectedDay(new Date().toISOString().split('T')[0]); setIsAddModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                  <Plus className="w-4 h-4"/> Etkinlik Ekle
               </button>
           )}
        </div>
      </div>

      {/* TAKVİM GRID */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[600px]">
         <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
               <div key={d} className="py-3 text-center text-sm font-bold text-gray-500 uppercase tracking-wide">{d}</div>
            ))}
         </div>

         <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {daysArray.map((day, idx) => {
               const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
               const dayEvents = events.filter(e => e.date === dateStr);
               const isToday = dateStr === new Date().toISOString().split('T')[0];

               return (
                  <div 
                    key={idx} 
                    // DROP EVENTS
                    onDragOver={handleDragOver}
                    onDrop={(e) => day && handleDrop(e, dateStr)}
                    // CLICK TO ADD
                    onClick={() => { if(day && isManager) { setSelectedDay(dateStr); setIsAddModalOpen(true); } }} 
                    className={`min-h-[100px] border-b border-r border-gray-100 p-2 transition-colors relative group 
                        ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/10'} 
                        ${isToday ? 'bg-blue-50/40' : ''}`}
                  >
                     {day && (
                        <>
                           <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>{day}</span>
                           <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                              {dayEvents.map((evt, i) => (
                                 <div 
                                    key={i} 
                                    // DRAG EVENTS
                                    draggable={evt.isDraggable}
                                    onDragStart={(e) => handleDragStart(e, evt)}
                                    // CLICK TO EDIT
                                    onClick={(e) => {
                                        e.stopPropagation(); // Parent click (Add Event) çalışmasın
                                        if (evt.type !== 'Leave' && isManager) {
                                            setSelectedEvent(evt);
                                            setIsDetailModalOpen(true);
                                        }
                                    }}
                                    className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium flex items-center gap-1 
                                        ${evt.color} ${evt.isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105 transition-transform' : 'cursor-default'}`} 
                                    title={evt.title}
                                 >
                                    {evt.type === 'Leave' && <User className="w-3 h-3 shrink-0"/>}
                                    {evt.type === 'Meeting' && <Briefcase className="w-3 h-3 shrink-0"/>}
                                    {evt.type === 'Payroll_Reminder' && <DollarSign className="w-3 h-3 shrink-0"/>}
                                    <span className="truncate">{evt.time ? `${evt.time} ` : ''}{evt.title}</span>
                                 </div>
                              ))}
                           </div>
                        </>
                     )}
                  </div>
               );
            })}
         </div>
      </div>

      {/* --- MODAL 1: YENİ ETKİNLİK EKLE --- */}
      {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <div><h3 className="font-bold text-gray-800">Etkinlik Ekle</h3><p className="text-xs text-gray-500 font-mono">{selectedDay}</p></div>
                   <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>
                
                <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                   <div><label className="block text-xs font-bold text-gray-500 mb-1">Başlık</label><input required className="w-full border rounded-lg p-2 text-sm" placeholder="Toplantı konusu..." value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}/></div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1">Tür</label>
                         <select className="w-full border rounded-lg p-2 text-sm bg-white" value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}>
                            <option value="Meeting">Toplantı</option>
                            <option value="Task">Görev</option>
                            <option value="Deadline">Deadline</option>
                            <option value="Payroll_Reminder">Maaş / Ödeme</option>
                         </select>
                      </div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Saat</label><input type="time" className="w-full border rounded-lg p-2 text-sm" value={newEvent.start_time} onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}/></div>
                   </div>

                   <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> Katılımcılar</label>
                      <select className="w-full border rounded-lg p-2 text-sm bg-white mb-2" value={newEvent.target_audience} onChange={(e) => setNewEvent({...newEvent, target_audience: e.target.value, target_id: ''})}>
                          <option value="Company">🏢 Tüm Şirket</option>
                          <option value="Department">👥 Belirli Departman</option>
                          <option value="Person">👤 Belirli Kişi</option>
                      </select>
                      {newEvent.target_audience === 'Department' && (
                          <select required className="w-full border rounded-lg p-2 text-sm bg-white" value={newEvent.target_id} onChange={(e) => setNewEvent({...newEvent, target_id: e.target.value})}>
                              <option value="">Departman Seçin...</option>
                              {departments.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                      )}
                      {newEvent.target_audience === 'Person' && (
                          <select required className="w-full border rounded-lg p-2 text-sm bg-white" value={newEvent.target_id} onChange={(e) => setNewEvent({...newEvent, target_id: e.target.value})}>
                              <option value="">Personel Seçin...</option>
                              {allEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                          </select>
                      )}
                   </div>
                   <div><label className="block text-xs font-bold text-gray-500 mb-1">Açıklama</label><textarea className="w-full border rounded-lg p-2 text-sm h-20 resize-none" placeholder="Detaylar..." value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}/></div>
                   <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">Etkinliği Oluştur</button>
                </form>
             </div>
         </div>
      )}

      {/* --- MODAL 2: ETKİNLİK DETAY & DÜZENLE --- */}
      {isDetailModalOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <h3 className="font-bold text-gray-800">Etkinlik Detayları</h3>
                   <button onClick={() => setIsDetailModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>
                
                <div className="p-6 space-y-4">
                   {/* Düzenlenebilir Alanlar */}
                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1">Başlık</label>
                       <input className="w-full border rounded-lg p-2 text-sm font-bold text-gray-800" value={selectedEvent.title} onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}/>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Tarih</label>
                           <input type="date" className="w-full border rounded-lg p-2 text-sm" value={selectedEvent.date} onChange={(e) => setSelectedEvent({...selectedEvent, date: e.target.value})}/>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Saat</label>
                           <input type="time" className="w-full border rounded-lg p-2 text-sm" value={selectedEvent.time} onChange={(e) => setSelectedEvent({...selectedEvent, time: e.target.value})}/>
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1">Açıklama</label>
                       <textarea className="w-full border rounded-lg p-2 text-sm h-20 resize-none" value={selectedEvent.description || ''} onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}/>
                   </div>

                   {/* Aksiyon Butonları */}
                   <div className="flex gap-3 pt-2">
                       <button onClick={handleCancelEvent} className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-lg font-bold hover:bg-red-100 flex items-center justify-center gap-2">
                           <Trash2 className="w-4 h-4"/> İptal Et
                       </button>
                       <button onClick={handleUpdateEvent} className="flex-[2] bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                           <Edit2 className="w-4 h-4"/> Kaydet
                       </button>
                   </div>
                </div>
             </div>
          </div>
      )}

      {/* --- MODAL 3: SÜRÜKLE BIRAK ONAY --- */}
      {isDragConfirmOpen && draggedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-6">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6"/>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Tarih Değişikliği</h3>
                <p className="text-gray-500 text-sm mt-2">
                    <strong>{draggedEvent.title}</strong> etkinliğini şu tarihe taşımak istiyor musunuz?
                </p>
                <div className="my-4 bg-blue-50 text-blue-700 font-bold py-2 rounded-lg text-sm border border-blue-100">
                    {dropTargetDate}
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => setIsDragConfirmOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">Vazgeç</button>
                    <button onClick={confirmDrop} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Onayla</button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
}