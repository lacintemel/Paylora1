import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  FileText, Download, Trash2, Upload, Search, 
  Loader2, X, FileCheck, Shield, File
} from 'lucide-react';

export default function Documents({ userRole, currentUserId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- YENİ EKLENEN STATE'LER ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form Verisi
  const [formData, setFormData] = useState({
    name: '',
    type: 'General' // Varsayılan tür
  });

  // Doküman Türleri
  const docTypes = [
    { id: 'General', label: 'Genel Belge' },
    { id: 'Contract', label: 'Sözleşme / Anlaşma' },
    { id: 'ID', label: 'Kimlik / Ehliyet' },
    { id: 'Report', label: 'Rapor / Tutanak' },
    { id: 'Payroll', label: 'Maaş Bordrosu' },
    { id: 'Resume', label: 'CV / Özgeçmiş' },
  ];

  useEffect(() => {
    if (currentUserId) fetchDocuments();
  }, [currentUserId, userRole]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select(`*, employees:employee_id (name)`)
        .order('created_at', { ascending: false });

      // Çalışan sadece kendi dosyasını görür
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

  // --- 1. DOSYA SEÇME ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Dosya adını otomatik olarak inputa doldur (uzantısız)
      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      setFormData(prev => ({ ...prev, name: fileNameWithoutExt }));
    }
  };

  // --- 2. YÜKLEME İŞLEMİ (UPLOAD) ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !formData.name) return alert("Lütfen dosya seçin ve isim girin.");

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`; 

      // A) Storage'a Yükle
      const { error: uploadError } = await supabase.storage
        .from('documents') 
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // B) URL Al
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // C) Veritabanına Yaz (Seçilen Tür ve İsimle)
      const { error: dbError } = await supabase.from('documents').insert({
        name: formData.name,      // Kullanıcının girdiği isim
        title: formData.name,     // Yedek olarak title'a da yazalım
        type: formData.type,      // Seçilen tür
        file_url: publicUrl,
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        employee_id: currentUserId,
        uploaded_by: currentUserId
      });

      if (dbError) throw dbError;

      alert("Dosya başarıyla yüklendi! ✅");
      closeModal();
      fetchDocuments();

    } catch (error) {
      alert("Yükleme hatası: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu dosyayı silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) { alert("Silme hatası: " + error.message); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setFormData({ name: '', type: 'General' });
  };

  const filteredDocs = documents.filter(doc => 
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BAŞLIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doküman Merkezi</h1>
          <p className="text-gray-500">
            {userRole === 'employee' ? 'Kendi belgelerinizi yönetin.' : 'Tüm şirket belgelerini yönetin.'}
          </p>
        </div>
        
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold transition-all shadow-sm"
        >
            <Upload className="w-4 h-4"/> Dosya Yükle
        </button>
      </div>

      {/* ARAMA */}
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

      {/* LİSTE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-bold">Dosya</th>
              <th className="px-6 py-4 font-bold">Tür</th>
              <th className="px-6 py-4 font-bold">Boyut</th>
              <th className="px-6 py-4 font-bold">Yükleyen</th>
              <th className="px-6 py-4 font-bold text-right">İşlem</th>
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
                      <div>
                          <p className="font-bold text-gray-800">{doc.name}</p>
                          <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                        {docTypes.find(t => t.id === doc.type)?.label || doc.type || 'Belge'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{doc.size}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                       {doc.employee_id === currentUserId ? 'Siz' : doc.employees?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4" /></a>
                      {(['general_manager', 'hr'].includes(userRole) || doc.employee_id === currentUserId) && (
                          <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- YÜKLEME MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Yeni Doküman Yükle</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                </div>
                
                <form onSubmit={handleUpload} className="p-6 space-y-4">
                    
                    {/* 1. Dosya Seçimi */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                        <input 
                            type="file" 
                            onChange={handleFileSelect} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {selectedFile ? (
                            <div className="flex flex-col items-center text-green-600">
                                <FileCheck className="w-8 h-8 mb-2"/>
                                <p className="font-bold text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                                <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <Upload className="w-8 h-8 mb-2"/>
                                <p className="font-bold text-sm">Dosya Seçmek İçin Tıkla</p>
                                <p className="text-xs">PDF, PNG, JPG, DOCX</p>
                            </div>
                        )}
                    </div>

                    {/* 2. Dosya İsmi */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Dosya İsmi</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                            placeholder="Örn: İş Sözleşmesi 2026"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    {/* 3. Dosya Türü */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Doküman Türü</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            {docTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Butonlar */}
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">İptal</button>
                        <button 
                            type="submit" 
                            disabled={uploading || !selectedFile} 
                            className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
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