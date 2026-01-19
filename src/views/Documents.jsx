import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  FileText, Download, Trash2, Upload, Plus, Search, Filter, File, Loader2
} from 'lucide-react';

export default function Documents({ userRole }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Policy');

  // YETKİ KONTROLÜ
  const canManage = ['hr', 'general_manager'].includes(userRole);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setDocuments(data || []);
    setLoading(false);
  };

  // --- DOSYA YÜKLEME ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Lütfen bir dosya seçin!");

    setUploading(true);
    try {
      // 1. Dosyayı Storage'a Yükle
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents') // Bucket adı
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL Al
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Veritabanına Kaydet
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      const { error: dbError } = await supabase.from('company_documents').insert([{
        title: title,
        category: category,
        file_url: publicUrl,
        file_type: fileExt.toUpperCase(),
        size: fileSizeMB,
        // uploaded_by: currentUserId (Gerekirse eklenebilir)
      }]);

      if (dbError) throw dbError;

      alert("Dosya başarıyla yüklendi!");
      setIsModalOpen(false);
      setFile(null);
      setTitle('');
      fetchDocuments();

    } catch (error) {
      alert("Yükleme Hatası: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- DOSYA SİLME ---
  const handleDelete = async (doc) => {
    if (!window.confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;

    // 1. Veritabanından Sil
    await supabase.from('company_documents').delete().eq('id', doc.id);
    
    // 2. Listeden Çıkar
    setDocuments(documents.filter(d => d.id !== doc.id));
    
    // (Not: Storage'dan silmek için dosya yolunu bilmek gerekir, şimdilik sadece DB'den siliyoruz)
  };

  // Filtreleme
  const filteredDocs = selectedCategory === 'All' 
    ? documents 
    : documents.filter(d => d.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doküman Merkezi</h1>
          <p className="text-gray-500">Şirket politikaları, sözleşmeler ve rehberler.</p>
        </div>
        
        {/* Sadece Yönetici Yükleyebilir */}
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" /> Dosya Yükle
          </button>
        )}
      </div>

      {/* FİLTRE TABLARI */}
      <div className="flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto">
        {['All', 'Policy', 'Contract', 'Guide', 'Form'].map(cat => (
           <button
             key={cat}
             onClick={() => setSelectedCategory(cat)}
             className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedCategory === cat 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
             }`}
           >
             {cat === 'All' ? 'Tüm Dosyalar' : cat}
           </button>
        ))}
      </div>

      {/* DOSYA LİSTESİ (GRID) */}
      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all group relative">
                 
                 {/* Dosya İkonu */}
                 <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                       ${doc.file_type === 'PDF' ? 'bg-red-50 text-red-600' : 
                         doc.file_type === 'DOCX' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                       {doc.file_type === 'PDF' ? <FileText className="w-6 h-6"/> : <File className="w-6 h-6"/>}
                    </div>
                    {canManage && (
                       <button onClick={() => handleDelete(doc)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    )}
                 </div>

                 {/* Bilgiler */}
                 <h3 className="font-bold text-gray-800 truncate" title={doc.title}>{doc.title}</h3>
                 <p className="text-xs text-gray-500 mt-1">{doc.category} • {doc.size}</p>
                 <p className="text-[10px] text-gray-400 mt-3">
                    {new Date(doc.created_at).toLocaleDateString('tr-TR')} tarihinde yüklendi
                 </p>

                 {/* İndir Butonu */}
                 <a 
                   href={doc.file_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="mt-4 w-full py-2 bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                 >
                    <Download className="w-4 h-4" /> Görüntüle / İndir
                 </a>
              </div>
           ))}

           {filteredDocs.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                 <FileText className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                 <p>Bu kategoride dosya bulunamadı.</p>
              </div>
           )}
        </div>
      )}

      {/* YÜKLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Yeni Dosya Yükle</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                 <div>
                    <label className="text-sm font-bold text-gray-700">Dosya Başlığı</label>
                    <input 
                      required 
                      className="w-full border p-2 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Örn: 2026 İzin Politikası"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-700">Kategori</label>
                    <select 
                      className="w-full border p-2 rounded-lg mt-1 outline-none bg-white"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                       <option value="Policy">Policy (Politika)</option>
                       <option value="Contract">Contract (Sözleşme)</option>
                       <option value="Guide">Guide (Rehber)</option>
                       <option value="Form">Form</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-700">Dosya Seç</label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                       <input 
                         type="file" 
                         required
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={e => setFile(e.target.files[0])}
                         accept=".pdf,.doc,.docx,.xls,.xlsx"
                       />
                       <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2"/>
                       <p className="text-sm text-gray-600 font-medium">
                          {file ? file.name : "Dosyayı buraya sürükleyin veya seçin"}
                       </p>
                    </div>
                 </div>

                 <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-600">İptal</button>
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                    >
                       {uploading && <Loader2 className="w-4 h-4 animate-spin"/>}
                       {uploading ? 'Yükleniyor...' : 'Yükle'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}