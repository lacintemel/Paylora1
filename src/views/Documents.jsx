import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';

export default function Documents() {
  // Örnek veri
  const docs = [
    { id: 1, name: 'İş Sözleşmesi.pdf', type: 'Sözleşme', date: '12.01.2025' },
    { id: 2, name: 'Şirket Politikaları v2.pdf', type: 'Yönetmelik', date: '15.01.2025' },
    { id: 3, name: 'Bordro_Ocak_2026.pdf', type: 'Finans', date: '01.02.2026' },
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Belgelerim</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Yeni Belge Yükle
        </button>
      </div>

      <div className="overflow-hidden border rounded-lg">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-6 py-3 font-medium">Belge Adı</th>
              <th className="px-6 py-3 font-medium">Tür</th>
              <th className="px-6 py-3 font-medium">Tarih</th>
              <th className="px-6 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t border-gray-100">
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center gap-3 text-gray-900 font-medium">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {doc.name}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4">{doc.date}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button className="p-1 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                  <button className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}