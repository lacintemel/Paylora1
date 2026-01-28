import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Star, ChevronLeft, ChevronRight, 
  BarChart2, Clock, Calendar, Sparkles, Loader2,
  TrendingUp, DollarSign, Award, X, TrendingDown, Minus
} from 'lucide-react';
import { getInitials, isValidImageUrl } from '../utils/avatarHelper';

export default function Performance({ userRole, currentUserId }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const getMonday = (d) => {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }
  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()).toISOString().split('T')[0]);
  const isManager = ['general_manager', 'hr'].includes(userRole);

  useEffect(() => { fetchPerformanceData(); }, [selectedWeek, userRole]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // A) Çalışanları Çek
      let empQuery = supabase.from('employees').select('*').eq('status', 'Active');
      if (!isManager) empQuery = empQuery.eq('id', currentUserId);
      const { data: emps, error } = await empQuery;
      if (error) throw error;

      // B) Tarih Aralığı
      const startOfWeek = new Date(selectedWeek);
      const endOfWeek = new Date(startOfWeek); 
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // C) Verileri Çek
      const { data: allLeaves } = await supabase.from('leave_requests').select('*').eq('status', 'Approved');
      
      const { data: weeklyLogs } = await supabase.from('time_logs').select('*')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);
      
      const { data: reviews } = await supabase.from('performance_reviews').select('*').eq('week_start_date', selectedWeek);

      // Satış verileri (bu hafta ve toplam)
      const { data: allSales } = await supabase.from('sales').select('amount, sale_date, employee_id');
      
      const weeklySales = (allSales || []).filter(s => {
        const saleDate = new Date(s.sale_date);
        return saleDate >= startOfWeek && saleDate <= endOfWeek;
      });

      // D) Hesaplama
      const analyzedData = (emps || []).map(emp => {
          
          const employeeLeaves = (allLeaves || []).filter(l => l.employee_id === emp.id);

          // 1. BU HAFTA Kaç Gün Yok? (HEPSİ DAHİL: Yıllık, Hastalık, Mazeret)
          let daysOnLeaveThisWeek = 0;
          let leaveTypesThisWeek = [];
          employeeLeaves.forEach(l => {
              const lStart = new Date(l.start_date);
              const lEnd = new Date(l.end_date);

              // Kesişim yoksa geç
              if (lEnd < startOfWeek || lStart > endOfWeek) return;

              const overlapStart = lStart < startOfWeek ? startOfWeek : lStart;
              const overlapEnd = lEnd > endOfWeek ? endOfWeek : lEnd;
              const diffTime = Math.abs(overlapEnd - overlapStart);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
              
              daysOnLeaveThisWeek += diffDays;
              if (!leaveTypesThisWeek.includes(l.leave_type)) {
                leaveTypesThisWeek.push(l.leave_type);
              }
          });

          // 2. YILLIK BAKİYE (SADECE 'Yıllık İzin' OLANLAR DÜŞER)
          const totalUsedAnnualDays = employeeLeaves
            .filter(l => {
              const type = (l.leave_type || '').toLowerCase();
              return type.includes('annual') || type.includes('yıllık');
            })
            .reduce((acc, curr) => {
              // days kolonunu kullan, yoksa tarih farkından hesapla
              if (curr.days) return acc + curr.days;
              const start = new Date(curr.start_date);
              const end = new Date(curr.end_date);
              const diffTime = Math.abs(end - start);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return acc + diffDays;
            }, 0);
          
          const annualRights = emp.annual_leave_days || 14; 
          const remainingLeave = Math.max(0, annualRights - totalUsedAnnualDays);

          // 3. SATIŞ ANALİZİ (Bu hafta ve bu haftaya kadar toplam)
          const empWeeklySales = weeklySales.filter(s => s.employee_id === emp.id);
          const weekSalesAmount = empWeeklySales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
          const weekSalesCount = empWeeklySales.length;

          // Bu haftaya kadar olan tüm satışlar (birikimli)
          const empCumulativeSales = (allSales || []).filter(s => {
            const saleDate = new Date(s.sale_date);
            return s.employee_id === emp.id && saleDate <= endOfWeek;
          });
          const cumulativeSalesAmount = empCumulativeSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

          // Diğer veriler
          const daysWorkedThisWeek = (weeklyLogs || []).filter(l => l.employee_id === emp.id).length;
          const review = reviews?.find(r => r.employee_id === emp.id);

          return {
              ...emp,
              stats: { 
                  daysWorked: daysWorkedThisWeek, 
                  leaveThisWeek: daysOnLeaveThisWeek,
                  leaveTypes: leaveTypesThisWeek,
                  remainingLeave: remainingLeave,     
                  totalRights: annualRights,
                  weekSales: weekSalesAmount,
                  weekSalesCount: weekSalesCount,
                  totalSales: cumulativeSalesAmount  // Bu haftaya kadar birikimli toplam
              },
              review: review || { rating: 0, feedback: '' }
          };
      });
      setEmployees(analyzedData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

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
        const { error } = await supabase.from('performance_reviews').upsert(payload);
        if (error) throw error;
        setEmployees(prev => prev.map(e => e.id === empId ? { ...e, review: { ...e.review, rating, feedback } } : e));
    } catch (error) { alert("Hata: " + error.message); }
  };

  // AI Analiz
  const analyzeEmployee = async (empId, empName) => {
    setAnalyzing(empId);
    try {
        // Performans puanları
        const { data: allReviews } = await supabase.from('performance_reviews').select('rating, week_start_date').eq('employee_id', empId).order('week_start_date', { ascending: true });
        if (!allReviews || allReviews.length < 3) {
            alert("⚠️ Yetersiz Veri: Analiz için en az 3 haftalık puanlama verisi gerekli.");
            setAnalyzing(null); return;
        }
        
        // İzin verileri
        const { data: empLeaves } = await supabase.from('leave_requests').select('*').eq('employee_id', empId).eq('status', 'Approved');
        
        // Satış verileri
        const { data: allEmpSales } = await supabase.from('sales').select('amount, sale_date').eq('employee_id', empId).order('sale_date', { ascending: true });
        
        // Son 8 haftalık veriyi al
        const recentReviews = allReviews.slice(-8);
        const ratings = recentReviews.map(r => r.rating);
        const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        
        // Trend hesapla
        const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
        const secondHalf = ratings.slice(Math.floor(ratings.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trendDirection = secondAvg > firstAvg ? 'yükseliş' : secondAvg < firstAvg ? 'düşüş' : 'sabit';
        
        // Haftalık satış analizi (Birikimli toplam hesapla)
        const weeklyDataWithSales = recentReviews.map((review, idx) => {
            const weekStart = new Date(review.week_start_date);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            // Bu haftanın satışları
            const weekSales = (allEmpSales || []).filter(s => {
                const saleDate = new Date(s.sale_date);
                return saleDate >= weekStart && saleDate <= weekEnd;
            });
            const weekSalesAmount = weekSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
            
            // Birikimli toplam (bu haftaya kadar olan tüm satışlar)
            const cumulativeSales = (allEmpSales || []).filter(s => {
                const saleDate = new Date(s.sale_date);
                return saleDate <= weekEnd;
            });
            const cumulativeAmount = cumulativeSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
            
            return {
                ...review,
                weekSales: weekSalesAmount,
                totalSales: cumulativeAmount
            };
        });
        
        // İzin-Performans Analizi
        let leaveAnalysis = "Yeterli izin verisi yok.";
        if (empLeaves && empLeaves.length > 0) {
            const dayOfWeekPerformance = {};
            
            empLeaves.forEach(leave => {
                const leaveStart = new Date(leave.start_date);
                const leaveEnd = new Date(leave.end_date);
                
                // İzinden sonraki haftanın puanını bul
                const afterLeaveWeek = allReviews.find(r => {
                    const reviewDate = new Date(r.week_start_date);
                    return reviewDate >= leaveEnd && reviewDate <= new Date(leaveEnd.getTime() + 14 * 24 * 60 * 60 * 1000);
                });
                
                if (afterLeaveWeek) {
                    const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][leaveStart.getDay()];
                    if (!dayOfWeekPerformance[dayName]) dayOfWeekPerformance[dayName] = [];
                    dayOfWeekPerformance[dayName].push(afterLeaveWeek.rating);
                }
            });
            
            // En verimli izin günü
            let bestDay = null;
            let bestAvg = 0;
            Object.keys(dayOfWeekPerformance).forEach(day => {
                const avg = dayOfWeekPerformance[day].reduce((a, b) => a + b, 0) / dayOfWeekPerformance[day].length;
                if (avg > bestAvg) {
                    bestAvg = avg;
                    bestDay = day;
                }
            });
            
            if (bestDay) {
                leaveAnalysis = `${bestDay} günü izin kullandığında sonraki hafta ortalama ${bestAvg.toFixed(1)} puan performans gösteriyor. Bu günler izin için en uygun.`;
            }
        }
        
        // AI Önerileri
        let recommendations = [];
        if (avgRating >= 4.5) {
            recommendations = [
                "Mükemmel performans sergiliyor, liderlik fırsatları sunulabilir.",
                "Yüksek potansiyelli çalışan, mentorluk rolü verilebilir.",
                "Ödüllendirme ve terfi değerlendirmesi yapılmalı.",
                leaveAnalysis
            ];
        } else if (avgRating >= 3.5) {
            recommendations = [
                "İyi performans gösteriyor, gelişim alanları belirlenebilir.",
                "Hedef odaklı eğitim programları önerilebilir.",
                "Düzenli geri bildirimle performans artırılabilir.",
                leaveAnalysis
            ];
        } else {
            recommendations = [
                "Performans gelişim planı oluşturulmalı.",
                "Birebir koçluk ve mentorluk desteği sağlanmalı.",
                "Hedeflerin netleştirilmesi ve destek artırılmalı.",
                leaveAnalysis
            ];
        }
        
        setAnalysisResult({
            empName,
            avgRating,
            trend: trendDirection,
            trendIcon: trendDirection === 'yükseliş' ? 'up' : trendDirection === 'düşüş' ? 'down' : 'stable',
            weeklyData: weeklyDataWithSales,
            recommendations
        });

    } catch (error) { console.error(error); } finally { setAnalyzing(null); }
  };

  const changeWeek = (offset) => {
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + (offset * 7));
    setSelectedWeek(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-2 md:p-0">
       
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

       <div className="grid grid-cols-1 gap-5">
          {loading ? ( <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-purple-600"/> Veriler hesaplanıyor...</div> ) : (
             (employees || []).map(emp => (
                <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center relative hover:shadow-md transition-shadow">
                   
                   {isManager && (
                       <button onClick={() => analyzeEmployee(emp.id, emp.name)} disabled={analyzing === emp.id} className="absolute top-4 right-4 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-200 z-10">
                          {analyzing === emp.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} AI Analiz
                       </button>
                   )}

                   <div className="flex items-center gap-4 w-full lg:w-1/4 min-w-[200px]">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-xl text-gray-600 shadow-inner overflow-hidden border border-gray-100">
                         {isValidImageUrl(emp.avatar) ? <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" /> : getInitials(emp.name)}
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800 text-lg leading-tight">{emp.name}</h3>
                         <p className="text-sm text-gray-500 font-medium">{emp.position}</p>
                         <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 tracking-wide uppercase">{emp.department}</span>
                      </div>
                   </div>

                   <div className="flex gap-4 w-full lg:w-1/3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      
                      <div className="flex-1 text-center border-r border-gray-200">
                         <div className="text-[10px] text-gray-400 uppercase font-extrabold mb-1 tracking-wider">Ofis Günü</div>
                         <div className="text-xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-green-500"/> {emp.stats?.daysWorked || 0}
                         </div>
                         <div className="text-[9px] text-gray-400 mt-1">Bu Hafta</div>
                      </div>

                      <div className="flex-1 text-center border-r border-gray-200">
                         <div className="text-[10px] text-gray-400 uppercase font-extrabold mb-1 tracking-wider">İzinli</div>
                         <div className={`text-xl font-bold flex items-center justify-center gap-1.5 ${
                           emp.stats.leaveThisWeek > 0 ? 'text-orange-600' : 'text-gray-800'
                         }`}>
                             <Calendar className="w-4 h-4 text-orange-500"/> {emp.stats.leaveThisWeek}
                         </div>
                         <div className="text-[9px] text-gray-500 mt-1 font-medium">
                            {emp.stats.leaveTypes?.length > 0 ? (
                              <span className="bg-orange-50 text-orange-600 px-1 rounded">
                                {emp.stats.leaveTypes.join(', ')}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                         </div>
                      </div>

                      <div className="flex-1 text-center">
                         <div className="text-[10px] text-gray-400 uppercase font-extrabold mb-1 tracking-wider">Satış</div>
                         <div className="text-xl font-bold text-green-600 flex items-center justify-center gap-1.5">
                             <TrendingUp className="w-4 h-4"/> {emp.stats?.weekSalesCount || 0}
                         </div>
                         <div className="text-[9px] text-gray-500 mt-1">
                           {emp.stats?.weekSalesCount > 0 ? (
                             <span className="text-gray-600">Adet bu hafta</span>
                           ) : (
                             <span className="text-gray-400">Bu hafta yok</span>
                           )}
                         </div>
                      </div>

                   </div>

                   {/* Ek Bilgi Paneli - Yıllık İzin ve Toplam Satış */}
                   <div className="w-full lg:w-auto flex gap-3 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-xl border border-blue-100">
                      <div className="flex-1 text-center">
                         <div className="text-[9px] text-blue-400 uppercase font-bold mb-1">Yıllık Kalan</div>
                         <div className={`text-lg font-black ${
                           emp.stats.remainingLeave < 3 ? 'text-red-600' : 'text-blue-600'
                         }`}>
                            {emp.stats.remainingLeave}/{emp.stats.totalRights}
                         </div>
                      </div>
                      <div className="flex-1 text-center border-l border-blue-200 pl-3">
                         <div className="text-[9px] text-purple-400 uppercase font-bold mb-1">Satış</div>
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-center gap-1">
                               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                               <span className="text-[8px] text-gray-600">Hafta:</span>
                               <span className="text-sm font-black text-blue-600">${(emp.stats?.weekSales || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1">
                               <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                               <span className="text-[8px] text-gray-600">Toplam:</span>
                               <span className="text-sm font-black text-purple-600">${(emp.stats?.totalSales || 0).toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} disabled={!isManager} onClick={() => handleSaveReview(emp.id, star, emp.review?.feedback)} className={`p-1 transition-all ${isManager ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}>
                               <Star className={`w-8 h-8 drop-shadow-sm ${star <= (emp.review?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            </button>
                         ))}
                         <span className="ml-3 text-sm font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{emp.review?.rating > 0 ? `${emp.review.rating}/5` : 'Puan Yok'}</span>
                      </div>
                      
                      {isManager ? (
                          <div className="flex gap-2">
                             <input type="text" placeholder="Not ekleyin..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white" defaultValue={emp.review?.feedback || ''} onBlur={(e) => { if(e.target.value !== (emp.review?.feedback || '')) handleSaveReview(emp.id, emp.review?.rating || 0, e.target.value); }} />
                          </div>
                      ) : (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-2">
                             <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"/>
                             <p className="text-sm text-gray-600 italic">{emp.review?.feedback || 'Yönetici henüz bir değerlendirme notu girmedi.'}</p>
                          </div>
                      )}
                   </div>

                </div>
             ))
          )}
       </div>

       {/* AI Analiz Modal */}
       {analysisResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white rounded-t-2xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                         <Sparkles className="w-6 h-6"/>
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold">{analysisResult.empName}</h2>
                         <p className="text-purple-100 text-sm">AI Performans Analizi</p>
                      </div>
                   </div>
                   <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-6 h-6"/>
                   </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                   
                   {/* Özet Kartlar */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                         <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Ortalama Puan</div>
                         <div className="text-3xl font-black text-blue-700 flex items-center gap-2">
                            {analysisResult.avgRating}
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400"/>
                         </div>
                         <div className="text-xs text-blue-500 mt-1">Son 8 hafta ortalaması</div>
                      </div>
                      
                      <div className={`p-4 rounded-xl border ${
                         analysisResult.trendIcon === 'up' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
                         analysisResult.trendIcon === 'down' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
                         'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                         <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${
                            analysisResult.trendIcon === 'up' ? 'text-green-600' :
                            analysisResult.trendIcon === 'down' ? 'text-red-600' : 'text-gray-600'
                         }`}>Performans Trendi</div>
                         <div className={`text-3xl font-black flex items-center gap-2 ${
                            analysisResult.trendIcon === 'up' ? 'text-green-700' :
                            analysisResult.trendIcon === 'down' ? 'text-red-700' : 'text-gray-700'
                         }`}>
                            {analysisResult.trendIcon === 'up' && <TrendingUp className="w-8 h-8"/>}
                            {analysisResult.trendIcon === 'down' && <TrendingDown className="w-8 h-8"/>}
                            {analysisResult.trendIcon === 'stable' && <Minus className="w-8 h-8"/>}
                            <span className="capitalize">{analysisResult.trend}</span>
                         </div>
                      </div>
                   </div>

                   {/* Haftalık Trend Grafiği */}
                   <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                         <BarChart2 className="w-5 h-5 text-purple-600"/> Haftalık Performans & Satış Grafiği
                      </h3>
                      <div className="space-y-4">
                         {/* Performans Grafiği */}
                         <div>
                            <div className="text-xs text-gray-500 font-semibold mb-3">Performans Puanı</div>
                            <div className="flex items-end justify-between gap-3 h-48 bg-white p-4 rounded-lg">
                               {analysisResult.weeklyData.map((review, idx) => {
                                  const heightPercent = (review.rating / 5) * 100;
                                  return (
                                     <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                        {/* Puan sayısı üstte */}
                                        <div className="text-sm font-bold text-gray-700 mb-1">{review.rating.toFixed(1)}</div>
                                        {/* Sütun grafiği */}
                                        <div className="relative w-full flex items-end" style={{ height: '140px' }}>
                                           <div 
                                              className={`w-full rounded-t-lg shadow-md transition-all hover:shadow-lg hover:scale-105 ${
                                                 review.rating >= 4.5 ? 'bg-gradient-to-t from-green-600 to-green-400' :
                                                 review.rating >= 4 ? 'bg-gradient-to-t from-green-500 to-green-300' :
                                                 review.rating >= 3 ? 'bg-gradient-to-t from-yellow-500 to-yellow-300' : 
                                                 'bg-gradient-to-t from-red-500 to-red-300'
                                              }`}
                                              style={{ height: `${heightPercent}%`, minHeight: '10px' }}
                                           >
                                              {/* Gradient overlay */}
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-t-lg"></div>
                                           </div>
                                        </div>
                                        {/* Tarih altta */}
                                        <div className="text-[10px] text-gray-500 font-semibold text-center mt-1">
                                           {new Date(review.week_start_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>

                         {/* Satış İstatistikleri */}
                         <div className="border-t border-gray-200 pt-4">
                            <div className="text-xs text-gray-500 font-semibold mb-3">Haftalık & Birikimli Satış</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               {analysisResult.weeklyData.map((review, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                     <div className="text-[8px] text-gray-400 uppercase font-bold mb-1">
                                        {new Date(review.week_start_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                                     </div>
                                     <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                           <span className="text-[10px] text-gray-500">Hafta:</span>
                                           <span className="text-xs font-bold text-blue-600">${(review.weekSales || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                           <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                           <span className="text-[10px] text-gray-500">Toplam:</span>
                                           <span className="text-xs font-bold text-purple-600">${(review.totalSales || 0).toLocaleString()}</span>
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* AI Önerileri */}
                   <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                         <Sparkles className="w-5 h-5 text-purple-600"/> AI Önerileri
                      </h3>
                      <ul className="space-y-2">
                         {analysisResult.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                               <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                               <span className="text-sm leading-relaxed">{rec}</span>
                            </li>
                         ))}
                      </ul>
                   </div>

                   {/* Kapatma Butonu */}
                   <button 
                      onClick={() => setAnalysisResult(null)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                   >
                      Kapat
                   </button>

                </div>
             </div>
          </div>
       )}
    </div>
  );
}