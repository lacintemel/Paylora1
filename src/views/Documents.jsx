import React, { useState } from 'react';
import { FileText, Download, Upload, Plus, X, Search, Filter } from 'lucide-react';

export default function Documents() {
  // Mock Belge Verileri
  const [documents, setDocuments] = useState([
    { id: 1, name: 'İş Sözleşmesi Taslağı.pdf', type: 'PDF', date: '2026-01-10', size: '2.4 MB' },
    { id: 2, name: 'Şirket Politikaları v2.docx', type: 'Word', date: '2026-01-05', size: '1.1 MB' },
    { id: 3, name: 'Ocak Ayı Bordro Listesi.xlsx', type: 'Excel', date: '2026-01-15', size: '4.5 MB' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  // Belge Ekleme Fonksiyonu
  const handleUpload = (e) => {
    e.preventDefault();
    if (!newDocName) return;

    const newDoc = {
      id: documents.length + 1,
      name: newDocName,
      type: 'PDF', // Simülasyon için sabit
      date: new Date().toISOString().split('T')[0],
      size: '1.0 MB'
    };

    setDocuments([newDoc, ...documents]);
    setIsModalOpen(false);
    setNewDocName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Başlık ve Upload Butonu */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Şirket Belgeleri</h1>
          <p className="text-gray-500">Tüm resmi evraklar ve sözleşmeler.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" /> Belge Yükle
        </button>
      </div>

      {/* Belge Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <input type="text" placeholder="Belge ara..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"/>
           </div>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
            <tr><th className="px-6 py-4">Dosya Adı</th><th className="px-6 py-4">Tür</th><th className="px-6 py-4">Tarih</th><th className="px-6 py-4">Boyut</th><th className="px-6 py-4 text-right">İşlem</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                  <span className="font-medium text-gray-800">{doc.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{doc.type}</td>
                <td className="px-6 py-4 text-gray-500">{doc.date}</td>
                <td className="px-6 py-4 text-gray-500">{doc.size}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"><Download className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Yeni Belge Yükle</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                    <p className="text-sm text-gray-500">Dosyayı buraya sürükleyin veya seçin</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Dosya Adı</label>
                    <input 
                        type="text" 
                        required
                        className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: Şubat Raporu.pdf"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Yükle</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}