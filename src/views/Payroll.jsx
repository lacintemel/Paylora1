import React, { useState } from 'react';
import { 
  DollarSign, 
  Download, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { payrollData, employeesData } from '../data/mockData';

export default function Payroll() {
  // --- STATE YÖNETİMİ ---
  const [payrolls, setPayrolls] = useState(payrollData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // --- İŞLEVLER ---

  // 1. Durum Değiştirme (Tekli Ödeme Yap)
  const handleMarkAsPaid = (id) => {
    const updatedPayrolls = payrolls.map(record => 
      record.id === id ? { ...record, status: 'Paid' } : record
    );
    setPayrolls(updatedPayrolls);
  };

  // 2. YENİ EKLENDİ: Toplu Ödeme Mantığı
  const handlePayAll = () => {
    const pendingCount = payrolls.filter(p => p.status === 'Processing').length;
    
    if (pendingCount === 0) {
      alert("Bekleyen ödeme bulunmamaktadır.");
      return;
    }

    if (window.confirm(`${pendingCount} adet bekleyen maaş ödemesini onaylıyor musunuz?`)) {
      const updatedPayrolls = payrolls.map(record => ({ ...record, status: 'Paid' }));
      setPayrolls(updatedPayrolls);
    }
  };

  // 3. Veri Birleştirme ve Filtreleme
  const filteredRecords = payrolls.map(record => {
    const employee = employeesData.find(e => e.id === record.employeeId);
    return { ...record, employee }; 
  }).filter(item => {
    const matchesSearch = item.employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 4. İstatistik Hesaplama
  const totalPayout = filteredRecords.reduce((acc, curr) => acc + curr.net, 0);
  const pendingCount = filteredRecords.filter(p => p.status === 'Processing').length;
  const paidCount = filteredRecords.filter(p => p.status === 'Paid').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK VE AKSİYON --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maaş Yönetimi</h1>
          <p className="text-gray-500">
            Ocak 2026 Dönemi Bordroları
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium">
            <Download className="w-4 h-4" />
            Toplu Excel İndir
          </button>
          <button 
            onClick={handlePayAll} // <-- BURASI DÜZELTİLDİ
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <DollarSign className="w-4 h-4" />
            Tümünü Öde
          </button>
        </div>
      </div>

      {/* --- FİNANSAL ÖZET KARTLARI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Ödenecek</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">${totalPayout.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">İşlem Bekleyen</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{pendingCount} Kişi</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600"><Clock className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Ödemesi Yapılan</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{paidCount} Kişi</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><CheckCircle className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* --- FİLTRE VE TABLO --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Çalışan ara..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              className="pl-2 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Tüm Durumlar</option>
              <option value="Processing">İşlem Bekleyenler</option>
              <option value="Paid">Ödenenler</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Çalışan</th>
                <th className="px-6 py-4">Departman</th>
                <th className="px-6 py-4">Dönem</th>
                <th className="px-6 py-4">Brüt Maaş</th>
                <th className="px-6 py-4 font-bold text-gray-800">Net Ödenen</th>
                <th className="px-6 py-4 text-center">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {item.employee?.avatar || '??'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.employee?.name || 'Bilinmiyor'}</p>
                        <p className="text-xs text-gray-500">{item.employee?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.employee?.department}</td>
                  <td className="px-6 py-4 text-gray-500">{item.period}</td>
                  <td className="px-6 py-4 text-gray-400">${item.salary.toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${item.net.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'Paid' ? <><CheckCircle className="w-3 h-3" /> Ödendi</> : <><Clock className="w-3 h-3" /> Bekliyor</>}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status === 'Processing' ? (
                      <button 
                        onClick={() => handleMarkAsPaid(item.id)}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                      >
                        Ödemeyi Yap
                      </button>
                    ) : (
                      <button className="text-gray-400 hover:text-blue-600 p-1"><FileText className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}