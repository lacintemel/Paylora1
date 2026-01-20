import React, { useState, useEffect } from 'react';
import { supabase } from "../supabase";
   import { Megaphone, Calendar, ArrowRight } from 'lucide-react';

// 👇 onNavigate prop'unu buraya ekledik!
export default function DashboardAnnouncements({ userRole, currentUser, onNavigate }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // Sadece son 3 duyuruyu getir (Widget olduğu için)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3); 

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Duyuru hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          Duyurular
        </h2>
        {/* GM veya HR ise "Yeni Ekle" butonu (Opsiyonel, yer varsa) */}
        {['general_manager', 'hr'].includes(userRole) && (
           <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold">
             Yönetici
           </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-4">Yükleniyor...</p>
        ) : announcements.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Henüz duyuru yok.</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                  ${ann.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                    ann.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                    'bg-green-50 text-green-600 border-green-100'}`}>
                  {ann.priority === 'High' ? 'Önemli' : ann.priority === 'Medium' ? 'Normal' : 'Bilgi'}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">{ann.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 👇 "TÜMÜNÜ GÖR" BUTONU */}
      <div className="mt-4 pt-4 border-t border-gray-50 text-center">
        <button 
            onClick={() => onNavigate('announcements')} 
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 w-full transition-colors"
        >
            Tüm Duyuruları Gör <ArrowRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}