import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Clock, Plus, X, User, DollarSign, Briefcase, 
  Users, CornerDownLeft, ShieldAlert
} from 'lucide-react';

export default function Planner({ userRole, currentUserId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Kullanıcı Detayları (Departman filtresi için lazım)
  const [myProfile, setMyProfile] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]); // Modalda kişi seçmek için

  // Yeni Etkinlik Formu
  const [newEvent, setNewEvent] = useState({
    title: '', 
    type: 'Meeting', 
    start_time: '09:00', 
    description: '',
    target_audience: 'Company', // Company, Department, Person
    target_id: '' // Departman adı veya Personel ID'si
  });

  const isManager = ['general_manager', 'hr'].includes(userRole);
  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Product'];

  useEffect(() => {
    if (currentUserId) {
        fetchMyProfile();
        fetchEmployeesList();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (myProfile) fetchAllEvents();
  }, [currentDate, myProfile]); // Profil yüklendikten sonra etkinlikleri çek

  // --- KULLANICI BİLGİLERİ ---
  const fetchMyProfile = async () => {
    const { data } = await supabase.from('employees').select('*').eq('id', currentUserId).single();
    setMyProfile(data);
  };

  const fetchEmployeesList = async () => {
    const { data } = await supabase.from('employees').select('id, name, department');
    setAllEmployees(data || []);
  };

  // --- ETKİNLİKLERİ ÇEK VE FİLTRELE ---
  const fetchAllEvents = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    try {
      // 1. İzinleri Çek
      let leaveQuery = supabase.from('leave_requests').select(`*, employees(name)`).eq('status', 'Approved');
      // Çalışan sadece kendini görsün, Manager hepsini (İstersen burada herkesin iznini çalışana da açabilirsin)
      if (!isManager) leaveQuery = leaveQuery.eq('employee_id', currentUserId);
      const { data: leaves } = await leaveQuery;

      // 2. Takvim Etkinlikleri Çek (Hepsini çekip JS ile filtreleyeceğiz, daha esnek)
      const { data: calendarEvents } = await supabase.from('calendar_events').select('*')
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth);

      // --- VERİLERİ İŞLE ---
      
      // A) İzinler & İzin Dönüşleri
      const formattedLeaves = [];
      const returnEvents = [];

      (leaves || []).forEach(l => {
         // İzin Bloğu
         formattedLeaves.push({
            id: `leave-${l.id}`,
            date: l.start_date.split('T')[0],
            title: `${l.employees?.name?.split(' ')[0]} - İzinli`,
            type: 'Leave',
            color: 'bg-orange-50 text-orange-700 border-orange-100 opacity-70'
         });

         // Dönüş Günü (Bitiş + 1 Gün)
         const endDate = new Date(l.end_date);
         endDate.setDate(endDate.getDate() + 1); // 1 gün ekle
         const returnDateStr = endDate.toISOString().split('T')[0];
         
         // Sadece bu aya denk geliyorsa ekle
         if(returnDateStr >= startOfMonth.split('T')[0] && returnDateStr <= endOfMonth.split('T')[0]){
             returnEvents.push({
                id: `return-${l.id}`,
                date: returnDateStr,
                title: `${l.employees?.name?.split(' ')[0]} Dönüş`,
                type: 'Return',
                color: 'bg-teal-50 text-teal-700 border-teal-200 font-bold'
             });
         }
      });

      // B) Takvim Etkinlikleri (Filtreleme Mantığı)
      const formattedEvents = (calendarEvents || []).filter(evt => {
         // 1. Yöneticiyse hepsini gör
         if (isManager) return true;
         // 2. Maaş Hatırlatması ise SADECE yönetici görsün (Yukarıda geçmediyse buraya düşer)
         if (evt.type === 'Payroll_Reminder') return false; 
         // 3. Şirket Geneliyse (department & employee_id NULL)
         if (!evt.department && !evt.employee_id) return true;
         // 4. Benim Departmanımsa
         if (evt.department === myProfile.department) return true;
         // 5. Bana özelse
         if (evt.employee_id === currentUserId) return true;
         
         return false; // Diğer durumlarda gizle
      }).map(e => ({
        id: `event-${e.id}`,
        date: e.start_date.split('T')[0],
        title: e.title,
        time: e.start_date.split('T')[1].slice(0,5),
        type: e.type,
        color: getEventColor(e.type)
      }));

      setEvents([...formattedLeaves, ...returnEvents, ...formattedEvents]);

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

  // --- YENİ ETKİNLİK EKLEME ---
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      const fullDate = `${selectedDay}T${newEvent.start_time}:00`;
      
      // Target Mantığı
      let empId = null;
      let dept = null;

      if (newEvent.target_audience === 'Person') empId = newEvent.target_id;
      if (newEvent.target_audience === 'Department') dept = newEvent.target_id;
      // Company seçiliyse ikisi de NULL kalır (Herkese görünür)

      const { error } = await supabase.from('calendar_events').insert({
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        start_date: fullDate,
        employee_id: empId,
        department: dept
      });

      if (error) throw error;
      
      alert("Etkinlik takvime işlendi! ✅");
      setIsModalOpen(false);
      fetchAllEvents();
      setNewEvent({ title: '', type: 'Meeting', start_time: '09:00', description: '', target_audience: 'Company', target_id: '' });

    } catch (error) {
      alert("Hata: " + error.message);
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
    if (dayNum > 0 && dayNum <= daysInMonth) return dayNum;
    return null;
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
               {isManager ? 'Şirket etkinliklerini ve izinleri yönetin.' : 'Takviminizi ve şirket duyurularını takip edin.'}
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-md transition-shadow"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
              <span className="px-4 font-bold text-gray-800 min-w-[140px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-md transition-shadow"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
           </div>
           
           {/* Sadece yetkililer etkinlik ekler (İstersen çalışana da açabilirsin) */}
           {isManager && (
               <button onClick={() => { setSelectedDay(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm">
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
                  <div key={idx} onClick={() => { if(day && isManager) { setSelectedDay(dateStr); setIsModalOpen(true); } }} className={`min-h-[100px] border-b border-r border-gray-100 p-2 transition-colors relative group ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/10'} ${isToday ? 'bg-blue-50/40' : ''}`}>
                     {day && (
                        <>
                           <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>{day}</span>
                           <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                              {dayEvents.map((evt, i) => (
                                 <div key={i} className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium flex items-center gap-1 cursor-help ${evt.color}`} title={evt.title}>
                                    {evt.type === 'Leave' && <User className="w-3 h-3 shrink-0"/>}
                                    {evt.type === 'Payroll_Reminder' && <DollarSign className="w-3 h-3 shrink-0"/>}
                                    {evt.type === 'Meeting' && <Briefcase className="w-3 h-3 shrink-0"/>}
                                    {evt.type === 'Return' && <CornerDownLeft className="w-3 h-3 shrink-0"/>}
                                    <span className="truncate">{evt.time ? `${evt.time} ` : ''}{evt.title}</span>
                                 </div>
                              ))}
                           </div>
                           {isManager && <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:text-blue-600"><Plus className="w-3 h-3"/></button>}
                        </>
                     )}
                  </div>
               );
            })}
         </div>
      </div>

      {/* --- ETKİNLİK MODALI --- */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                   <div><h3 className="font-bold text-gray-800">Etkinlik Ekle</h3><p className="text-xs text-gray-500 font-mono">{selectedDay}</p></div>
                   <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
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

                   {/* --- HEDEF KİTLE SEÇİMİ --- */}
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

    </div>
  );
}