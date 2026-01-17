import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Building2, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Giriş Simülasyonu (Gerçek Backend bağlanınca burası değişecek)
    setTimeout(() => {
      if (email === 'admin@paylora.com' && password === '1234') {
        onLogin('general_manager');
      } else if (email === 'hr@paylora.com' && password === '1234') {
        onLogin('hr');
      } else if (email === 'user@paylora.com' && password === '1234') {
        onLogin('employee');
      } else {
        setError('Hatalı e-posta veya şifre! (İpucu: admin@paylora.com / 1234)');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* Kart Yapısı */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[600px]">
        
        {/* SOL: Form Alanı */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">Paylora</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tekrar Hoşgeldiniz</h1>
          <p className="text-gray-500 mb-8">Hesabınıza erişmek için lütfen giriş yapın.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Hata Mesajı */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="isim@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-sm text-blue-600 hover:underline">Şifremi Unuttum?</button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {isLoading ? 'Giriş Yapılıyor...' : (
                <>Giriş Yap <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Test İpuçları (Geliştirme aşamasında kolaylık olsun diye) */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
            <p className="font-bold mb-2 text-gray-500">Test Hesapları:</p>
            <div className="grid grid-cols-3 gap-2">
               <button onClick={() => {setEmail('admin@paylora.com'); setPassword('1234')}} className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-left">
                  <span className="block font-bold text-gray-700">Admin</span>
                  1234
               </button>
               <button onClick={() => {setEmail('hr@paylora.com'); setPassword('1234')}} className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-left">
                  <span className="block font-bold text-gray-700">İK</span>
                  1234
               </button>
               <button onClick={() => {setEmail('user@paylora.com'); setPassword('1234')}} className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-left">
                  <span className="block font-bold text-gray-700">Çalışan</span>
                  1234
               </button>
            </div>
          </div>
        </div>

        {/* SAĞ: Görsel Alanı */}
        <div className="hidden md:block w-1/2 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90"></div>
          
          {/* Dekoratif Daireler */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 h-full flex flex-col justify-center p-12 text-white">
            <h2 className="text-4xl font-bold mb-6 leading-tight">İnsan Kaynakları Yönetiminde Yeni Çağ.</h2>
            <p className="text-blue-100 text-lg mb-8">
              Paylora ile tüm personel süreçlerinizi, maaş ödemelerinizi ve performans takiplerinizi tek bir yerden yönetin.
            </p>
            
            {/* İstatistik Kartı Süsü */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-fit">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                 <span className="text-sm font-medium">Sistem Durumu</span>
              </div>
              <div className="text-2xl font-bold">100% Aktif</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}