import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Star, ChevronLeft, ChevronRight, 
  BarChart2, Clock, Calendar, Sparkles, Loader2,
  TrendingUp, AlertCircle
} from 'lucide-react';

export default function Performance({ userRole, currentUserId }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);

  // Tarih Fonksiyonu: Seçilen tarihin Pazartesini bulur
  const getMonday = (d) => {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }
  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()).toISOString().split('T')[0]);

  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedWeek, userRole]);

  // --- 1. VERİLERİ ÇEK VE ANALİZ ET ---
  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // A) Çalışanları Çek
      let empQuery = supabase.from('employees').select('id, name, avatar, department, position').eq('status', 'Active');
      if (!isManager) empQuery = empQuery.eq('id', currentUserId);
      const { data: emps, error: empError } = await empQuery;
      if (empError) throw empError;

      // B) Tarih Aralığı
      const startDate = new Date(selectedWeek);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // C) İzinler, Loglar ve Puanlar
      const { data: leaves } = await supabase.from('leave_requests').select('*').eq('status', 'Approved').gte('start_date', startStr).lte('end_date', endStr);
      const { data: logs } = await supabase.from('time_logs').select('*').gte('date', startStr).lte('date', endStr);
      const { data: reviews } = await supabase.from('performance_reviews').select('*').eq('week_start_date', selectedWeek);

      // D) Verileri Birleştir
      const analyzedData = (emps || []).map(emp => {
          // İzin Günleri
          const empLeaves = leaves?.filter(l => l.employee_id === emp.id) || [];
          const totalLeaveDays = empLeaves.reduce((acc, curr) => acc + (curr.days || 0), 0);
          
          // Çalışma Günleri
          const empLogs = logs?.filter(l => l.employee_id === emp.id) || [];
          const daysWorked = empLogs.length;
          
          // Mevcut Puan
          const review = reviews?.find(r => r.employee_id === emp.id);

          return {
              ...emp,
              stats: { daysWorked, leaveDays: totalLeaveDays },
              review: review || { rating: 0, feedback: '' }
          };
      });
      
      setEmployees(analyzedData);

    } catch (error) { 
      console.error("Hata:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 2. PUAN KAYDETME (AUTO SAVE) ---
  const handleSaveReview = async (empId, rating, feedback) => {
    if (!isManager) return;
    try {
        const payload = {
            employee_id: empId,
            week_start_date: selectedWeek,
            rating,
            feedback,
            reviewer_id: (await supabase.auth.getUser()).data.user?.id
        };
        const { error } = await supabase.from('performance_reviews').upsert(payload, { onConflict: 'employee_id, week_start_date' });
        if (error) throw error;
        
        // Arayüzü güncelle
        setEmployees(prev => prev.map(e => e.id === empId ? { ...e, review: { ...e.review, rating, feedback } } : e));
        
    } catch (error) { 
        alert("Kaydetme hatası: " + error.message); 
    }
  };

  // --- 3. 🤖 AI ANALİZ ALGORİTMASI ---
  const analyzeEmployee = async (empId, empName) => {
    setAnalyzing(empId);
    try {
        // Geçmiş tüm verileri çek
        const { data: allReviews } = await supabase.from('performance_reviews').select('rating, week_start_date').eq('employee_id', empId);
        
        if (!allReviews || allReviews.length < 3) {
            alert("⚠️ Yetersiz Veri: Analiz için bu personelin en az 3 farklı haftada puanlanmış olması gerekir.");
            setAnalyzing(null);
            return;
        }

        const { data: allLeaves } = await supabase.from('leave_requests').select('start_date').eq('employee_id', empId).eq('status', 'Approved');

        // İstatistik Toplayıcılar
        let stats = {
            withLeave: { sum: 0, count: 0 },
            noLeave: { sum: 0, count: 0 }
        };

        allReviews.forEach(review => {
            const rStart = new Date(review.week_start_date);
            const rEnd = new Date(rStart); rEnd.setDate(rEnd.getDate() + 6);

            // Bu hafta izin kullanmış mı?
            const hasLeave = allLeaves?.some(l => {
                const lDate = new Date(l.start_date);
                return lDate >= rStart && lDate <= rEnd;
            });

            if (hasLeave) {
                stats.withLeave.sum += review.rating;
                stats.withLeave.count++;
            } else {
                stats.noLeave.sum += review.rating;
                stats.noLeave.count++;
            }
        });

        const avgWithLeave = stats.withLeave.count ? (stats.withLeave.sum / stats.withLeave.count).toFixed(1) : 0;
        const avgNoLeave = stats.noLeave.count ? (stats.noLeave.sum / stats.noLeave.count).toFixed(1) : 0;
        const diff = (avgWithLeave - avgNoLeave).toFixed(1);

        let resultMessage = "";
        if (Number(avgWithLeave) > Number(avgNoLeave)) {
            resultMessage = `🚀 TESPİT: ${empName}, izin kullandığı haftalarda ortalama +${diff} puan daha yüksek performans gösteriyor! Dinlenmek bu personele iyi geliyor.`;
        } else if (Number(avgNoLeave) > Number(avgWithLeave)) {
            resultMessage = `🛡️ TESPİT: ${empName}, kesintisiz (izinsiz) çalıştığı haftalarda daha odaklı ve yüksek performanslı.`;
        } else {
            resultMessage = `⚖️ TESPİT: İzin kullanımı ile performans arasında belirgin bir fark görülmedi. İstikrarlı bir çalışan.`;
        }

        alert(`📊 YAPAY ZEKA ANALİZ RAPORU\n\n👤 Personel: ${empName}\n\n🏖️ İzinli Haftalar Ort: ${avgWithLeave} / 5\n🏢 Full Çalışma Ort: ${avgNoLeave} / 5\n\n${resultMessage}`);

    } catch (error) {
        console.error(error);
        alert("Analiz sırasında hata oluştu.");
    } finally {
        setAnalyzing(null);
    }
  };

  const changeWeek = (offset) => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + (offset * 7));
    setSelectedWeek(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-2 md:p-0">
       
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-purple-600"/> Performans Yönetimi
             </h1>
             <p className="text-gray-500 text-sm">Haftalık verimlilik ve izin analizi.</p>
          </div>
          <div className="flex items-center bg-purple-50 rounded-lg p-1 border border-purple-100 shadow-sm">
             <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white rounded-md transition-shadow text-purple-700"><ChevronLeft className="w-5 h-5"/></button>
             <div className="px-6 text-center min-w-[140px]">
                <span className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest">Hafta Başlangıcı</span>
                <span className="block font-bold text-gray-800 text-sm">{new Date(selectedWeek).toLocaleDateString('tr-TR')}</span>
             </div>
             <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white rounded-md transition-shadow text-purple-700"><ChevronRight className="w-5 h-5"/></button>
          </div>
       </div>

       {/* LİSTE */}
       <div className="grid grid-cols-1 gap-5">
          {loading ? ( 
             <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600"/> Veriler analiz ediliyor...
             </div> 
          ) : (
             (employees || []).map(emp => (
                <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center relative hover:shadow-md transition-shadow">
                   
                   {/* AI Analiz Butonu (Sadece Manager) */}
                   {isManager && (
                       <button 
                         onClick={() => analyzeEmployee(emp.id, emp.name)}
                         disabled={analyzing === emp.id}
                         className="absolute top-4 right-4 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-200 z-10"
                       >
                          {analyzing === emp.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                          AI Analiz
                       </button>
                   )}

                   {/* 1. KİŞİ KARTI */}
                   <div className="flex items-center gap-4 w-full lg:w-1/4 min-w-[200px]">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-xl text-gray-600 shadow-inner">
                         {emp.avatar || emp.name.charAt(0)}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800 text-lg leading-tight">{emp.name}</h3>
                         <p className="text-sm text-gray-500 font-medium">{emp.position}</p>
                         <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 tracking-wide uppercase">{emp.department}</span>
                      </div>
                   </div>

                   {/* 2. VERİLER (Ofis vs İzin) */}
                   <div className="flex gap-4 w-full lg:w-1/4 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 text-center border-r border-gray-200">
                         <div className="text-[10px] text-gray-400 uppercase font-extrabold mb-1 tracking-wider">Ofis Günü</div>
                         <div className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-green-500"/> {emp.stats?.daysWorked || 0}
                         </div>
                      </div>
                      <div className="flex-1 text-center">
                         <div className="text-[10px] text-gray-400 uppercase font-extrabold mb-1 tracking-wider">İzin Günü</div>
                         <div className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                            <Calendar className="w-4 h-4 text-orange-500"/> {emp.stats?.leaveDays || 0}
                         </div>
                      </div>
                   </div>

                   {/* 3. PUANLAMA & YORUM */}
                   <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                               key={star} 
                               disabled={!isManager} 
                               onClick={() => handleSaveReview(emp.id, star, emp.review?.feedback)} 
                               className={`p-1 transition-all ${isManager ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
                            >
                               <Star className={`w-8 h-8 drop-shadow-sm ${star <= (emp.review?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            </button>
                         ))}
                         <span className="ml-3 text-sm font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                            {emp.review?.rating > 0 ? `${emp.review.rating}/5` : 'Puan Yok'}
                         </span>
                      </div>
                      
                      {isManager ? (
                          <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="Performans notu ekleyin..." 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white" 
                                defaultValue={emp.review?.feedback || ''} 
                                onBlur={(e) => { 
                                    if(e.target.value !== (emp.review?.feedback || '')) handleSaveReview(emp.id, emp.review?.rating || 0, e.target.value); 
                                }} 
                             />
                          </div>
                      ) : (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-2">
                             <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"/>
                             <p className="text-sm text-gray-600 italic">
                                {emp.review?.feedback || 'Yönetici henüz bir değerlendirme notu girmedi.'}
                             </p>
                          </div>
                      )}
                   </div>

                </div>
             ))
          )}
       </div>
    </div>
  );
}