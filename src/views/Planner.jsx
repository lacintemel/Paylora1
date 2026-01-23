import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Plus, X, User, DollarSign, Briefcase, 
  Users, Trash2, Edit2, Move, MapPin, Lock, Bell, Megaphone
} from 'lucide-react';

export default function Planner({ userRole, currentUserId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE YÖNETİMİ ---
  const [selectedDay, setSelectedDay] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDragConfirmOpen, setIsDragConfirmOpen] = useState(false);

  // Veriler
  const [myProfile, setMyProfile] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  
  // Seçimler
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dropTargetDate, setDropTargetDate] = useState(null);

  // Form Verisi
  const [newEvent, setNewEvent] = useState({
    title: '', type: 'Meeting', start_time: '09:00', description: '', location: '', target_audience: 'Company', target_id: ''
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

  // --- TARİH KAYDIRMA ---
  const adjustDateIfWeekend = (year, month, day) => {
    let date = new Date(year, month, day, 12, 0, 0); 
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) date.setDate(date.getDate() + 1);
    else if (dayOfWeek === 6) date.setDate(date.getDate() + 2);
    return date;
  };

  // --- VERİLERİ ÇEK ---
  const fetchAllEvents = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0).toISOString();

    try {
      // 1. İzinler
      let leaveQuery = supabase.from('leave_requests').select(`*, employees(name)`).eq('status', 'Approved');
      if (!isManager) leaveQuery = leaveQuery.eq('employee_id', currentUserId);
      const { data: leaves } = await leaveQuery;

      // 2. Takvim Etkinlikleri (Veritabanı)
      const { data: calendarEvents } = await supabase.from('calendar_events').select('*')
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
        .neq('status', 'Cancelled');

      // --- OTOMATİK SİSTEM ETKİNLİKLERİ ---
      const autoEvents = [];
      const meetingDate = adjustDateIfWeekend(year, month, 1);
      autoEvents.push({
          id: `sys-meet-${year}-${month}`,
          date: meetingDate.toISOString().split('T')[0],
          time: '09:00',
          title: '📅 Aylık Genel Toplantı',
          description: 'Aylık şirket değerlendirme toplantısı.',
          location: 'Ana Toplantı Salonu',
          target_audience: 'Company',
          type: 'Meeting',
          isSystem: true, isDraggable: false
      });

      const salaryDate = adjustDateIfWeekend(year, month, 15);
      autoEvents.push({
          id: `sys-salary-${year}-${month}`,
          date: salaryDate.toISOString().split('T')[0],
          time: '00:00',
          title: '💰 Maaş Ödeme Günü',
          description: 'Maaş ödemeleri gerçekleştirilecek.',
          location: 'Banka Transferi',
          target_audience: 'Company',
          type: 'Payroll_Reminder',
          isSystem: true, isDraggable: false
      });

      // --- İZİNLER ---
      const formattedLeaves = (leaves || []).map(l => ({
            id: `leave-${l.id}`,
            originalId: l.id,
            date: l.start_date.split('T')[0],
            title: `${l.employees?.name?.split(' ')[0]} - İzinli`,
            type: 'Leave',
            isSystem: true, isDraggable: false
      }));

      // --- DB ETKİNLİKLERİ ---
      const formattedDbEvents = (calendarEvents || []).filter(evt => {
         // Çalışanlar sadece kendilerini ilgilendirenleri görmeli
         if (isManager) return true;
         if (evt.target_audience === 'Company') return true;
         if (evt.target_audience === 'Department' && evt.department === myProfile.department) return true;
         if (evt.employee_id === currentUserId) return true;
         return false;
      }).map(e => ({
        id: `event-${e.id}`,
        originalId: e.id,
        date: e.start_date.split('T')[0],
        title: e.title,
        description: e.description,
        location: e.location,
        time: e.start_date.split('T')[1].slice(0,5),
        type: e.type,
        department: e.department,
        employee_id: e.employee_id,
        target_audience: e.target_audience,
        isSystem: false,
        isDraggable: isManager // Sadece yönetici sürükleyebilir
      }));

      setEvents([...autoEvents, ...formattedLeaves, ...formattedDbEvents]);

    } catch (error) {
      console.error("Takvim hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 🔥 ÇAKIŞMA KONTROLÜ ---
  const checkConflict = (date, time, audienceType, targetId) => {
    const conflicts = events.filter(e => e.date === date && e.time === time && !e.isSystem);
    for (let event of conflicts) {
        if (audienceType === 'Department' && event.department === targetId) return `HATA: ${targetId} için saat ${time}'da zaten "${event.title}" var!`;
        if (audienceType === 'Person' && event.employee_id === targetId) return `HATA: Personelin saat ${time}'da zaten "${event.title}" etkinliği var!`;
        if (event.target_audience === 'Company') return `HATA: Bu saatte Genel Şirket Toplantısı var.`;
    }
    return null;
  };

  // --- 📢 DUYURU VE BİLDİRİM GÖNDERME ---
  const createAnnouncementAndNotify = async (eventData, dateStr) => {
      // 1. Duyuru Oluştur (Sadece Toplantıysa)
      if (eventData.type === 'Meeting' && (eventData.target_audience === 'Company' || eventData.target_audience === 'Department')) {
          await supabase.from('announcements').insert({
              title: `📅 Yeni Toplantı: ${eventData.title}`,
              content: `${dateStr} tarihinde saat ${eventData.start_time}'da ${eventData.location || 'Ofiste'} toplantı yapılacaktır.`,
              audience: eventData.target_audience,
              target_dept: eventData.target_audience === 'Department' ? eventData.target_id : null,
              created_by: currentUserId
          });
      }

      // 2. Hedef Kitleyi Bul
      let targetUserIds = [];
      if (eventData.target_audience === 'Person') {
          targetUserIds = [eventData.target_id];
      } else if (eventData.target_audience === 'Department') {
          const { data } = await supabase.from('employees').select('id').eq('department', eventData.target_id);
          if(data) targetUserIds = data.map(u => u.id);
      } else if (eventData.target_audience === 'Company') {
          const { data } = await supabase.from('employees').select('id').eq('status', 'Active');
          if(data) targetUserIds = data.map(u => u.id);
      }

      // 3. Bildirimleri Gönder (Batch Insert)
      if (targetUserIds.length > 0) {
          const notifications = targetUserIds.map(uid => ({
              employee_id: uid,
              title: "Yeni Etkinlik Eklendi",
              message: `${eventData.title} - ${dateStr} ${eventData.start_time}`,
              type: 'Meeting'
          }));
          await supabase.from('notifications').insert(notifications);
      }
  };

  // --- CRUD İŞLEMLERİ ---
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    const conflictError = checkConflict(selectedDay, newEvent.start_time, newEvent.target_audience, newEvent.target_id);
    if (conflictError) return alert(conflictError);

    try {
      const fullDate = `${selectedDay}T${newEvent.start_time}:00`;
      let empId = null, dept = null;
      if (newEvent.target_audience === 'Person') empId = newEvent.target_id;
      if (newEvent.target_audience === 'Department') dept = newEvent.target_id;

      const { error } = await supabase.from('calendar_events').insert({
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        type: newEvent.type,
        start_date: fullDate,
        employee_id: empId,
        department: dept,
        target_audience: newEvent.target_audience,
        status: 'Active'
      });

      if (error) throw error;
      
      // 🔥 DUYURU VE BİLDİRİM TETİKLE
      await createAnnouncementAndNotify(newEvent, selectedDay);

      alert("Etkinlik Eklendi, Duyuru ve Bildirimler Gönderildi! ✅");
      setIsAddModalOpen(false);
      fetchAllEvents();
      setNewEvent({ title: '', type: 'Meeting', start_time: '09:00', description: '', location: '', target_audience: 'Company', target_id: '' });

    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const handleUpdateEvent = async () => {
    if(!selectedEvent || selectedEvent.isSystem) return;
    const fullDate = `${selectedEvent.date}T${selectedEvent.time}:00`;
    const { error } = await supabase.from('calendar_events').update({
        title: selectedEvent.title, description: selectedEvent.description, location: selectedEvent.location, start_date: fullDate
    }).eq('id', selectedEvent.originalId);
    if(!error) { alert("Güncellendi!"); setIsDetailModalOpen(false); fetchAllEvents(); }
  };

  const handleCancelEvent = async () => {
      if(!selectedEvent || selectedEvent.isSystem) return;
      if(!confirm("İptal etmek istiyor musunuz?")) return;
      const { error } = await supabase.from('calendar_events').update({ status: 'Cancelled' }).eq('id', selectedEvent.originalId);
      if(!error) { setIsDetailModalOpen(false); fetchAllEvents(); }
  };

  // --- SÜRÜKLE BIRAK (SADECE MANAGER) ---
  const handleDragStart = (e, event) => { if (event.isDraggable) { setDraggedEvent(event); e.dataTransfer.effectAllowed = "move"; } };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, date) => { e.preventDefault(); if (draggedEvent && draggedEvent.date !== date) { setDropTargetDate(date); setIsDragConfirmOpen(true); } };
  const confirmDrop = async () => {
      if (!draggedEvent || !dropTargetDate) return;
      const newFullDate = `${dropTargetDate}T${draggedEvent.time}:00`;
      await supabase.from('calendar_events').update({ start_date: newFullDate }).eq('id', draggedEvent.originalId);
      fetchAllEvents(); setDraggedEvent(null); setIsDragConfirmOpen(false);
  };

  // --- RENDER ---
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - (getFirstDayOfMonth(currentDate) === 0 ? 6 : getFirstDayOfMonth(currentDate) - 1) + 1;
    return (dayNum > 0 && dayNum <= getDaysInMonth(currentDate)) ? dayNum : null;
  });
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const getAudienceName = (e) => e.target_audience === 'Company' ? 'Tüm Şirket' : e.target_audience === 'Department' ? `${e.department} Dept.` : 'Özel Kişi';
  const getEventColor = (type, isSystem) => {
      if (type === 'Leave') return 'bg-orange-50 text-orange-700 border-orange-200 opacity-90';
      if (type === 'Payroll_Reminder') return 'bg-green-100 text-green-800 border-green-300 font-bold';
      if (type === 'Meeting' && isSystem) return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      return type === 'Meeting' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><CalIcon className="w-6 h-6 text-blue-600"/> Kurumsal Ajanda</h1>
           <p className="text-gray-500 text-sm">Etkinlikler ve Toplantılar</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded"><ChevronLeft className="w-4 h-4"/></button>
              <span className="px-4 font-bold min-w-[140px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded"><ChevronRight className="w-4 h-4"/></button>
           </div>
           {isManager && <button onClick={() => { setSelectedDay(new Date().toISOString().split('T')[0]); setIsAddModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2"><Plus className="w-4 h-4"/> Ekle</button>}
        </div>
      </div>

      {/* GRID */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-[600px]">
         <div className="grid grid-cols-7 bg-gray-50 border-b">{['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d=><div key={d} className="py-3 text-center text-sm font-bold text-gray-500">{d}</div>)}</div>
         <div className="grid grid-cols-7 flex-1">
            {daysArray.map((day, idx) => {
               const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
               const dayEvents = events.filter(e => e.date === dateStr);
               return (
                  <div key={idx} 
                    onDragOver={handleDragOver} onDrop={(e) => day && isManager && handleDrop(e, dateStr)}
                    onClick={() => { if(day && isManager) { setSelectedDay(dateStr); setIsAddModalOpen(true); } }} 
                    className={`min-h-[100px] border-b border-r p-2 relative ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/10'}`}
                  >
                     {day && <>
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</span>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                           {dayEvents.map((evt, i) => (
                              <div key={i} draggable={evt.isDraggable} onDragStart={(e) => handleDragStart(e, evt)}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                                className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium flex items-center gap-1 ${getEventColor(evt.type, evt.isSystem)} ${evt.isDraggable ? 'cursor-grab' : 'cursor-pointer hover:opacity-80'}`}
                              >
                                 {evt.isSystem && <Lock className="w-2 h-2 opacity-50"/>}
                                 <span className="truncate">{evt.time !== '00:00' ? evt.time : ''} {evt.title}</span>
                              </div>
                           ))}
                        </div>
                     </>}
                  </div>
               );
            })}
         </div>
      </div>

      {/* MODAL: EKLE (SADECE MANAGER) */}
      {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <h3 className="font-bold">Etkinlik Ekle ({selectedDay})</h3>
                   <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>
                <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                   <div><label className="text-xs font-bold text-gray-500">Başlık</label><input required className="w-full border rounded p-2 text-sm" value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title:e.target.value})}/></div>
                   <div><label className="text-xs font-bold text-gray-500 flex gap-1"><MapPin className="w-3 h-3"/> Konum</label><input className="w-full border rounded p-2 text-sm" value={newEvent.location} onChange={e=>setNewEvent({...newEvent, location:e.target.value})}/></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500">Tür</label><select className="w-full border rounded p-2 text-sm" value={newEvent.type} onChange={e=>setNewEvent({...newEvent, type:e.target.value})}><option value="Meeting">Toplantı</option><option value="Task">Görev</option></select></div>
                      <div><label className="text-xs font-bold text-gray-500">Saat</label><input type="time" className="w-full border rounded p-2 text-sm" value={newEvent.start_time} onChange={e=>setNewEvent({...newEvent, start_time:e.target.value})}/></div>
                   </div>
                   <div className="bg-gray-50 p-3 rounded border">
                      <label className="text-xs font-bold text-gray-500 mb-2 flex gap-1"><Users className="w-3 h-3"/> Katılımcılar</label>
                      <select className="w-full border rounded p-2 text-sm mb-2" value={newEvent.target_audience} onChange={e=>setNewEvent({...newEvent, target_audience:e.target.value, target_id:''})}>
                          <option value="Company">🏢 Tüm Şirket</option><option value="Department">👥 Departman</option><option value="Person">👤 Kişi</option>
                      </select>
                      {newEvent.target_audience === 'Department' && <select className="w-full border rounded p-2 text-sm" onChange={e=>setNewEvent({...newEvent, target_id:e.target.value})}>{['Seçiniz', ...departments].map(d=><option key={d} value={d}>{d}</option>)}</select>}
                      {newEvent.target_audience === 'Person' && <select className="w-full border rounded p-2 text-sm" onChange={e=>setNewEvent({...newEvent, target_id:e.target.value})}>{[{id:'', name:'Seçiniz'}, ...allEmployees].map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>}
                   </div>
                   <div><label className="text-xs font-bold text-gray-500">Açıklama</label><textarea className="w-full border rounded p-2 text-sm h-20" value={newEvent.description} onChange={e=>setNewEvent({...newEvent, description:e.target.value})}/></div>
                   <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded"><Bell className="w-3 h-3"/> Kaydettikten sonra katılımcılara bildirim gönderilecek.</div>
                   <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Oluştur ve Bildir</button>
                </form>
             </div>
         </div>
      )}

      {/* MODAL: DETAY (HERKES GÖREBİLİR, SADECE MANAGER DÜZENLER) */}
      {isDetailModalOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <h3 className="font-bold flex items-center gap-2">
                       {selectedEvent.isSystem ? <Lock className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>} Etkinlik Detayı
                   </h3>
                   <button onClick={() => setIsDetailModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                </div>
                <div className="p-6 space-y-4">
                   <div>
                       <label className="text-xs font-bold text-gray-500">Başlık</label>
                       {/* EĞER YÖNETİCİ DEĞİLSE İNPUT KİLİTLİ */}
                       <input disabled={!isManager || selectedEvent.isSystem} className="w-full border rounded p-2 text-sm font-bold bg-gray-50" value={selectedEvent.title} onChange={e=>setSelectedEvent({...selectedEvent, title:e.target.value})}/>
                   </div>

                   <div className="flex gap-4">
                       <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
                           <div className="text-xs text-blue-500 font-bold mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Kiminle?</div>
                           <div className="text-sm font-bold text-gray-700">{getAudienceName(selectedEvent)}</div>
                       </div>
                       <div className="flex-1 bg-purple-50 p-3 rounded-lg border border-purple-100">
                           <div className="text-xs text-purple-500 font-bold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Nerede?</div>
                           <input disabled={!isManager || selectedEvent.isSystem} className="w-full bg-transparent border-b border-purple-200 p-1 text-sm text-gray-800 font-medium outline-none" value={selectedEvent.location || ''} onChange={e=>setSelectedEvent({...selectedEvent, location:e.target.value})}/>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div><label className="text-xs font-bold text-gray-500">Tarih</label><input type="date" disabled={!isManager || selectedEvent.isSystem} className="w-full border rounded p-2 text-sm bg-gray-50" value={selectedEvent.date} onChange={e=>setSelectedEvent({...selectedEvent, date:e.target.value})}/></div>
                       <div><label className="text-xs font-bold text-gray-500">Saat</label><input type="time" disabled={!isManager || selectedEvent.isSystem} className="w-full border rounded p-2 text-sm bg-gray-50" value={selectedEvent.time} onChange={e=>setSelectedEvent({...selectedEvent, time:e.target.value})}/></div>
                   </div>

                   <div><label className="text-xs font-bold text-gray-500">Açıklama</label><textarea disabled={!isManager || selectedEvent.isSystem} className="w-full border rounded p-2 text-sm h-20 bg-gray-50" value={selectedEvent.description||''} onChange={e=>setSelectedEvent({...selectedEvent, description:e.target.value})}/></div>

                   {/* BUTONLAR SADECE YÖNETİCİYE GÖZÜKÜR */}
                   {isManager && !selectedEvent.isSystem && (
                       <div className="flex gap-3 pt-2 border-t mt-2">
                           <button onClick={handleCancelEvent} className="flex-1 bg-red-50 text-red-600 py-2 rounded font-bold hover:bg-red-100 flex justify-center gap-2"><Trash2 className="w-4 h-4"/> İptal</button>
                           <button onClick={handleUpdateEvent} className="flex-[2] bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex justify-center gap-2"><Edit2 className="w-4 h-4"/> Kaydet</button>
                       </div>
                   )}
                   {/* ÇALIŞANLAR İÇİN SADECE KAPAT BUTONU */}
                   {(!isManager || selectedEvent.isSystem) && (
                       <button onClick={() => setIsDetailModalOpen(false)} className="w-full bg-gray-100 text-gray-600 py-2 rounded font-bold hover:bg-gray-200">Kapat</button>
                   )}
                </div>
             </div>
          </div>
      )}
      
      {/* SÜRÜKLE ONAY MODALI */}
      {isDragConfirmOpen && draggedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Move className="w-6 h-6"/></div>
                <h3 className="font-bold text-lg">Tarih Değişikliği</h3>
                <p className="text-gray-500 text-sm mt-2"><strong>{draggedEvent.title}</strong> taşınıyor:</p>
                <div className="my-4 bg-blue-50 text-blue-700 font-bold py-2 rounded border border-blue-100">{dropTargetDate}</div>
                <div className="flex gap-3"><button onClick={()=>setIsDragConfirmOpen(false)} className="flex-1 bg-gray-100 font-bold py-2 rounded">Vazgeç</button><button onClick={confirmDrop} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded">Onayla</button></div>
             </div>
          </div>
      )}
    </div>
  );
}