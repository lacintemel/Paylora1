import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { FileText, Download, Trash2, Upload, Search, Filter, Loader2, Eye } from 'lucide-react';

export default function Documents({ userRole, currentUserId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUserId) fetchDocuments();
  }, [currentUserId, userRole]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          employees:employee_id (name)
        `)
        .order('created_at', { ascending: false });

      // 🔒 KRİTİK FİLTRELEME:
      // Eğer kullanıcı 'employee' ise SADECE kendi dokümanlarını görsün.
      if (userRole === 'employee') {
        query = query.eq('employee_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Doküman hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- DOKÜMAN YÜKLEME ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`; // Klasörleme: UserID/Dosya

      // 1. Storage'a Yükle
      const { error: uploadError } = await supabase.storage
        .from('documents') // Bucket adının 'documents' olduğundan emin ol
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL Al
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Veritabanına Yaz
      const { error: dbError } = await supabase.from('documents').insert({
        title: file.name,
        file_url: publicUrl,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        employee_id: currentUserId, // Yükleyen kişi
        uploaded_by: currentUserId
      });

      if (dbError) throw dbError;

      alert("Dosya başarıyla yüklendi!");
      fetchDocuments();

    } catch (error) {
      alert("Yükleme hatası: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- DOKÜMAN SİLME (Sadece Yetkili veya Kendi Dosyası) ---
  const handleDelete = async (id) => {
    if (!window.confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      alert("Silme hatası: " + error.message);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK VE AKSİYONLAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doküman Merkezi</h1>
          <p className="text-gray-500">
            {userRole === 'employee' ? 'Kendi belgelerinizi yönetin.' : 'Tüm şirket belgelerini yönetin.'}
          </p>
        </div>
        
        <div className="flex gap-3">
            <label className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 cursor-pointer font-bold transition-all shadow-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                <span>Dosya Yükle</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
        </div>
      </div>

      {/* ARAMA BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
         <Search className="w-5 h-5 text-gray-400" />
         <input 
           type="text" 
           placeholder="Dosya adı ara..." 
           className="flex-1 outline-none text-gray-700"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* DOKÜMAN LİSTESİ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-bold">Dosya Adı</th>
              <th className="px-6 py-4 font-bold">Tür / Boyut</th>
              <th className="px-6 py-4 font-bold">Yükleyen</th>
              <th className="px-6 py-4 font-bold">Tarih</th>
              <th className="px-6 py-4 font-bold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               <tr><td colSpan="5" className="p-8 text-center text-gray-500">Yükleniyor...</td></tr>
            ) : filteredDocs.length === 0 ? (
               <tr><td colSpan="5" className="p-8 text-center text-gray-500">Hiç doküman bulunamadı.</td></tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-800">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {doc.type?.split('/')[1]?.toUpperCase() || 'FILE'} • {doc.size}
                  </td>
                  <td className="px-6 py-4">
                    {/* Eğer yükleyen kendisiyse "Siz", değilse ismi */}
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                       {doc.employee_id === currentUserId ? 'Siz' : doc.employees?.name || 'Bilinmiyor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Görüntüle/İndir"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      
                      {/* Sadece Kendi Dosyasını veya Yöneticiyse Silebilir */}
                      {(['general_manager', 'hr'].includes(userRole) || doc.employee_id === currentUserId) && (
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}