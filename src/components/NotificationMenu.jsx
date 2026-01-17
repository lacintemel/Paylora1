import React from 'react';
import { Bell, Check, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function NotificationMenu({ notifications, onMarkAsRead, onClose }) {
  
  // Okunmamış sayısı
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // İkon seçici
  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'system': return <Info className="w-5 h-5 text-gray-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 top-14 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
      
      {/* Başlık */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-800">Bildirimler</h3>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {unreadCount} Yeni
          </span>
        )}
      </div>

      {/* Liste */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
            >
              <div className="mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {notif.title}
                  </p>
                  {!notif.isRead && <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {notif.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Bildiriminiz yok.</p>
          </div>
        )}
      </div>

      {/* Alt Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <button 
          onClick={onClose}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Tümünü Gör
        </button>
      </div>
    </div>
  );
}