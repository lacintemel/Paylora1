import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, Loader2, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Başarılı giriş sonrası App.jsx otomatik durumu yakalar ve yönlendirir.
      
    } catch (err) {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white animate-in fade-in duration-700">
      
      {/* SOL TARAF: GÖRSEL & MARKA (Mobilde Gizli) */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
        {/* Arkaplan Resmi */}
        <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
            alt="Office" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        
        {/* Dekoratif Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent mix-blend-multiply"></div>

        {/* İçerik */}
        <div className="relative z-10 p-12 text-white max-w-lg">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30">
                <LayoutDashboard className="w-8 h-8 text-white"/>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">İnsan Kaynaklarını Geleceğe Taşı.</h1>
            <p className="text-lg text-gray-300 leading-relaxed">
                Paylora ile işe alımdan bordroya, performanstan izin yönetimine kadar tüm süreçleri tek bir yerden yönetin.
            </p>
            
            {/* Küçük İstatistik Kartı */}
            <div className="mt-12 flex gap-8">
                <div>
                    <p className="text-3xl font-bold text-white">500+</p>
                    <p className="text-sm text-gray-400 mt-1">Mutlu Şirket</p>
                </div>
                <div className="w-px bg-gray-700 h-12"></div>
                <div>
                    <p className="text-3xl font-bold text-white">%98</p>
                    <p className="text-sm text-gray-400 mt-1">Müşteri Memnuniyeti</p>
                </div>
            </div>
        </div>
      </div>

      {/* SAĞ TARAF: FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
         <div className="w-full max-w-md space-y-8">
            
            {/* Mobil Logo (Sadece mobilde görünür) */}
            <div className="lg:hidden flex justify-center mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-white"/>
                </div>
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tekrar Hoş Geldiniz 👋</h2>
                <p className="text-gray-500 mt-2">Devam etmek için hesabınıza giriş yapın.</p>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Email Input */}
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email Adresi</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"/>
                        </div>
                        <input
                            type="email"
                            required
                            placeholder="ornek@paylora.com"
                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-gray-700">Şifre</label>
                        <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Şifremi Unuttum?</a>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors"/>
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">Giriş Yap <ArrowRight className="w-4 h-4"/></span>
                    )}
                </button>
            </form>

            {/* Footer / Demo Bilgisi */}
            <p className="text-center text-xs text-gray-400 mt-8">
                &copy; 2026 Paylora Inc. Tüm hakları saklıdır.
            </p>
         </div>
      </div>
    </div>
  );
}