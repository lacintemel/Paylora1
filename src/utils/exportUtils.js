import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Excel Export
export const exportToExcel = (data, filename = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Column genişliklerini otomatik ayarla
  const maxWidth = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(val => String(val).length)), 10);
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// PDF Export
export const exportToPDF = (data, columns, filename = 'export', title = 'Rapor') => {
  const doc = new jsPDF();
  
  // Başlık
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Tarih
  doc.setFontSize(10);
  doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28);
  
  // Tablo
  doc.autoTable({
    head: [columns.map(col => col.label)],
    body: data.map(row => columns.map(col => row[col.key] || '')),
    startY: 35,
    styles: { 
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  doc.save(`${filename}.pdf`);
};

// Payroll Export (Özel formatla)
export const exportPayrollToPDF = (payrolls, month) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('BORDRO RAPORU', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Dönem: ${month}`, 14, 30);
  doc.text(`Toplam Çalışan: ${payrolls.length}`, 14, 38);
  
  const totalAmount = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
  doc.text(`Toplam Ödeme: $${totalAmount.toLocaleString()}`, 14, 46);
  
  // Yardımcı: Hesaplama
  const calculateItemAmount = (item, salary) => {
    const val = parseFloat(item.value) || 0;
    return item.type === 'percent' ? (salary * val) / 100 : val;
  };
  
  doc.autoTable({
    head: [['Çalışan', 'Aylık Maaş', 'Kazançlar', 'Kesintiler', 'Net Maaş', 'Durum']],
    body: payrolls.map(p => {
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const totalDeductions = (p.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      return [
        p.employees?.name || 'Bilinmiyor',
        `$${baseSalary.toLocaleString()}`,
        `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.status === 'Paid' ? 'Ödendi' : 'Bekliyor'
      ];
    }),
    startY: 55,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] },
  });
  
  doc.save(`bordro_${month}.pdf`);
};

// Sales Export
export const exportSalesToExcel = (sales) => {
  const formattedData = sales.map(s => ({
    'Ürün/Hizmet': s.product_name,
    'Tutar': s.amount,
    'Tarih': new Date(s.sale_date).toLocaleDateString('tr-TR'),
    'Çalışan': s.employee?.name || '-',
    'Ekleyen': s.creator?.name || '-',
    'Notlar': s.notes || '-'
  }));
  
  exportToExcel(formattedData, `satislar_${new Date().toISOString().split('T')[0]}`);
};

// Employees Export
export const exportEmployeesToExcel = (employees) => {
  const formattedData = employees.map(e => ({
    'Ad Soyad': e.name,
    'Email': e.email,
    'Pozisyon': e.position,
    'Departman': e.department,
    'Maaş': e.salary,
    'Durum': e.status,
    'İşe Başlama': new Date(e.start_date).toLocaleDateString('tr-TR'),
  }));
  
  exportToExcel(formattedData, `calisanlar_${new Date().toISOString().split('T')[0]}`);
};

// Leave Requests Export
export const exportLeavesToPDF = (leaves) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('İZİN RAPORU', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
  doc.text(`Toplam İzin Talebi: ${leaves.length}`, 14, 38);
  
  doc.autoTable({
    head: [['Çalışan', 'İzin Türü', 'Başlangıç', 'Bitiş', 'Gün', 'Durum']],
    body: leaves.map(l => [
      l.employees?.name || 'Bilinmiyor',
      l.leave_type === 'annual' ? 'Yıllık' : l.leave_type === 'sick' ? 'Hastalık' : l.leave_type === 'unpaid' ? 'Ücretsiz' : l.leave_type,
      new Date(l.start_date).toLocaleDateString('tr-TR'),
      new Date(l.end_date).toLocaleDateString('tr-TR'),
      l.days || 0,
      l.status === 'Approved' ? 'Onaylı' : l.status === 'Rejected' ? 'Reddedildi' : 'Bekliyor'
    ]),
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  doc.save(`izinler_${new Date().toISOString().split('T')[0]}.pdf`);
};
