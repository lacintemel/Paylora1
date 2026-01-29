import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Türkçe karakterleri İngilizce'ye çevir
const cleanTurkish = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g');
};

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
  try {
    console.log('Bordro export başladı:', payrolls, month);
    
    if (!payrolls || payrolls.length === 0) {
      alert('Exportlamak için bordro verisi yok!');
      return;
    }

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
    
    // Manuel tablo başlığı
    let yPos = 55;
    const columns = ['Çalışan', 'Aylık Maaş', 'Kazançlar', 'Kesintiler', 'Net Maaş', 'Durum'];
    const colWidth = 30;
    
    // Header
    doc.setFillColor(34, 197, 94);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    columns.forEach((col, i) => {
      doc.text(col, 14 + i * colWidth, yPos);
    });
    
    // İçerik
    yPos += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    payrolls.forEach(p => {
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const totalDeductions = (p.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      const row = [
        p.employees?.name || 'Bilinmiyor',
        `$${baseSalary.toLocaleString()}`,
        `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.status === 'Paid' ? 'Ödendi' : 'Bekliyor'
      ];
      
      row.forEach((cell, i) => {
        doc.text(cell, 14 + i * colWidth, yPos);
      });
      
      yPos += 7;
      if (yPos > 270) {
        doc.addPage();
        yPos = 10;
      }
    });
    
    doc.save(`bordro_${month}.pdf`);
    console.log('Bordro PDF başarıyla kaydedildi');
  } catch (error) {
    console.error('Bordro export hatası:', error);
    alert('Export hatası: ' + error.message);
  }
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
  try {
    console.log('İzin export başladı:', leaves);
    
    if (!leaves || leaves.length === 0) {
      alert('Exportlamak için izin verisi yok!');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('İZİN RAPORU', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    doc.text(`Toplam İzin Talebi: ${leaves.length}`, 14, 38);
    
    // Manuel tablo başlığı
    let yPos = 50;
    const columns = ['Çalışan', 'İzin Türü', 'Başlangıç', 'Bitiş', 'Gün', 'Durum'];
    const colWidth = 30;
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    columns.forEach((col, i) => {
      doc.text(col, 14 + i * colWidth, yPos);
    });
    
    // İçerik
    yPos += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    leaves.forEach(l => {
      const row = [
        l.employees?.name || 'Bilinmiyor',
        l.leave_type === 'annual' ? 'Yıllık' : l.leave_type === 'sick' ? 'Hastalık' : l.leave_type === 'unpaid' ? 'Ücretsiz' : l.leave_type,
        new Date(l.start_date).toLocaleDateString('tr-TR'),
        new Date(l.end_date).toLocaleDateString('tr-TR'),
        l.days || 0,
        l.status === 'Approved' ? 'Onaylı' : l.status === 'Rejected' ? 'Reddedildi' : 'Bekliyor'
      ];
      
      row.forEach((cell, i) => {
        doc.text(String(cell), 14 + i * colWidth, yPos);
      });
      
      yPos += 7;
      if (yPos > 270) {
        doc.addPage();
        yPos = 10;
      }
    });
    
    doc.save(`izinler_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log('İzin PDF başarıyla kaydedildi');
  } catch (error) {
    console.error('İzin export hatası:', error);
    alert('Export hatası: ' + error.message);
  }
};

// Payroll Export - ÖZET Formatı
export const exportPayrollToPDF_Summary = (payrolls, month) => {
  try {
    if (!payrolls || payrolls.length === 0) {
      alert('Exportlamak icin bordro verisi yok!');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(cleanTurkish('BORDRO RAPORU (OZET)'), 14, 15);
    
    doc.setFontSize(10);
    doc.text(cleanTurkish(`Donem: ${month}`), 14, 22);
    doc.text(cleanTurkish(`Toplam Calisan: ${payrolls.length}`), 14, 28);
    
    let yPos = 38;
    
    // Kolon başlıkları
    const columns = [
      { label: cleanTurkish('Calisan'), width: 35 },
      { label: cleanTurkish('Calisma Gun'), width: 20 },
      { label: cleanTurkish('Izin'), width: 20 },
      { label: cleanTurkish('Aylik Maas'), width: 25 },
      { label: cleanTurkish('Kazanclar'), width: 25 },
      { label: cleanTurkish('Yassal Kesintiler'), width: 30 },
      { label: cleanTurkish('Ozel Kesintiler'), width: 25 },
      { label: cleanTurkish('Net Maas'), width: 25 },
      { label: cleanTurkish('Durum'), width: 20 }
    ];
    
    let xPos = 14;
    doc.setFillColor(34, 197, 94);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    columns.forEach(col => {
      doc.text(col.label, xPos, yPos);
      xPos += col.width;
    });
    
    yPos += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      return item.type === 'percent' ? (salary * val) / 100 : val;
    };
    
    payrolls.forEach(p => {
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      
      let legalDeductions = 0;
      let specialDeductions = 0;
      
      if (p.deductions_details && p.deductions_details.length > 0) {
        p.deductions_details.forEach(item => {
          const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
          const amount = calculateItemAmount(item, baseSalary);
          if (isLegal) {
            legalDeductions += amount;
          } else {
            specialDeductions += amount;
          }
        });
      }
      
      const totalDeductions = legalDeductions + specialDeductions;
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      const cleanName = cleanTurkish(p.employees?.name || p.employee_name || 'Bilinmiyor').toUpperCase();
      const workedDays = p.worked_days || 20;
      const leaveDetails = p.leave_details || [];
      const leaveStr = leaveDetails.length > 0 
        ? leaveDetails.map(l => cleanTurkish(l.type) + ':' + l.days).join(', ')
        : '-';
      
      const row = [
        cleanName,
        `${workedDays}`,
        leaveStr,
        `$${baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${legalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${specialDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.status === 'Paid' ? cleanTurkish('ODENDI') : cleanTurkish('BEKLIYOR')
      ];
      
      xPos = 14;
      row.forEach((cell, i) => {
        doc.text(String(cell), xPos, yPos);
        xPos += columns[i].width;
      });
      
      yPos += 6;
      if (yPos > 180) {
        doc.addPage();
        yPos = 14;
        
        // Başlık sayfada tekrar et
        xPos = 14;
        doc.setFillColor(34, 197, 94);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        columns.forEach(col => {
          doc.text(col.label, xPos, yPos);
          xPos += col.width;
        });
        
        yPos += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
      }
    });
    
    doc.save(`bordro_ozet_${month}.pdf`);
  } catch (error) {
    console.error('Bordro export hatasi:', error);
    alert('Export hatasi: ' + error.message);
  }
};

// Payroll Export - DETAYLI Formatı (Profesyonel Layout)
export const exportPayrollToPDF_Detailed = (payrolls, month) => {
  try {
    if (!payrolls || payrolls.length === 0) {
      alert('Exportlamak icin bordro verisi yok!');
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    
    const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      return item.type === 'percent' ? (salary * val) / 100 : val;
    };
    
    payrolls.forEach((p, idx) => {
      if (idx > 0) doc.addPage();
      
      // BASLIK
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(cleanTurkish(`AYRINTILI BORDRO RAPORU`), 14, 15);
      
      doc.setFontSize(11);
      doc.text(cleanTurkish(`${(p.employees?.name || p.employee_name || 'Bilinmiyor').toUpperCase()}`), 14, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(cleanTurkish(`Bolum: ${(p.department || p.employees?.department || '-')}`), 14, 27);
      doc.text(cleanTurkish(`Donem: ${month}`), 14, 31);
      
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const totalDeductions = (p.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      // Izin ve Calisma Gunleri
      const workedDays = p.worked_days || 20;
      const leaveDetails = p.leave_details || [];
      const totalLeaveDays = leaveDetails.reduce((sum, leave) => sum + (leave.days || 0), 0);
      
      let yPos = 37;
      const lineHeight = 5;
      
      // CALISMA GUNLERI VE IZIN BILGILERI
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 102, 204);
      doc.rect(14, yPos, 182, lineHeight + 2);
      doc.setTextColor(0, 0, 0);
      doc.text(cleanTurkish('CALISMA GUNLERI VE IZIN BILGILERI'), 16, yPos + 4);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(cleanTurkish(`Calisilan Gunler: ${workedDays} gun`), 16, yPos);
      doc.text(cleanTurkish(`Aylik Is Gunleri: 20 gun`), 100, yPos);
      yPos += 5;
      
      if (leaveDetails && leaveDetails.length > 0) {
        leaveDetails.forEach(leave => {
          const label = cleanTurkish(leave.type || 'Izin');
          doc.text(cleanTurkish(`${label}: ${leave.days || 0} gun`), 16, yPos);
          yPos += 4;
        });
      } else {
        doc.text(cleanTurkish('Izin kullanilmamis'), 16, yPos);
        yPos += 4;
      }
      
      yPos += 2;
      
      // BRUT UCRET VE KAZANCLAR
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(76, 175, 80);
      doc.rect(14, yPos, 182, lineHeight + 2);
      doc.setTextColor(0, 0, 0);
      doc.text(cleanTurkish('AYLIK BRUT UCRET VE KAZANCLAR'), 16, yPos + 4);
      yPos += 8;
      
      // Brut Ücret Değeri
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(cleanTurkish('Temel Aylik Maas:'), 16, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      yPos += 6;
      
      // Kazançlar
      if (p.earnings_details && p.earnings_details.length > 0) {
        doc.setFont('helvetica', 'normal');
        p.earnings_details.forEach(item => {
          const amount = calculateItemAmount(item, baseSalary);
          const label = cleanTurkish(item.name);
          const typeStr = item.type === 'percent' ? `${item.value}%` : `$${item.value}`;
          doc.text(`${label} (${typeStr}):`, 16, yPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
        });
      }
      
      yPos += 2;
      
      // Yasal Kesintiler
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(244, 67, 54);
      doc.rect(14, yPos, 182, lineHeight + 2);
      doc.setTextColor(0, 0, 0);
      doc.text(cleanTurkish('YASAL KESINTILER'), 16, yPos + 4);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      let legalDeductions = 0;
      if (p.deductions_details && p.deductions_details.length > 0) {
        p.deductions_details.forEach(item => {
          const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
          if (isLegal) {
            const amount = calculateItemAmount(item, baseSalary);
            legalDeductions += amount;
            const label = cleanTurkish(item.name);
            const typeStr = item.type === 'percent' ? `${item.value}%` : `$${item.value}`;
            doc.text(`${label} (${typeStr}):`, 16, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(`$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 5;
          }
        });
      }
      
      yPos += 2;
      
      // Özel Kesintiler
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(33, 150, 243);
      doc.rect(14, yPos, 182, lineHeight + 2);
      doc.setTextColor(0, 0, 0);
      doc.text(cleanTurkish('OZEL KESINTILER'), 16, yPos + 4);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      let specialDeductions = 0;
      if (p.deductions_details && p.deductions_details.length > 0) {
        p.deductions_details.forEach(item => {
          const isLegal = ['SGK', 'Vergi', 'Gelir', 'Damga', 'Issizlik'].some(word => item.name.includes(word));
          if (!isLegal) {
            const amount = calculateItemAmount(item, baseSalary);
            specialDeductions += amount;
            const label = cleanTurkish(item.name);
            const typeStr = item.type === 'percent' ? `${item.value}%` : `$${item.value}`;
            doc.text(`${label} (${typeStr}):`, 16, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(`$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 5;
          }
        });
      } else {
        doc.text(cleanTurkish('Yok'), 16, yPos);
        yPos += 5;
      }
      
      yPos += 3;
      
      // TOPLAM OZET
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(153, 102, 255);
      doc.rect(14, yPos, 182, lineHeight + 2);
      doc.setTextColor(0, 0, 0);
      doc.text(cleanTurkish('TOPLAM OZET'), 16, yPos + 4);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(cleanTurkish('Temel Maas:'), 16, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text(cleanTurkish('Toplam Kazanclar:'), 16, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text(cleanTurkish('Yasal Kesintiler:'), 16, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${legalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text(cleanTurkish('Ozel Kesintiler:'), 16, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${specialDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      yPos += 6;
      
      // NET MAAS
      doc.setLineWidth(0.5);
      doc.line(14, yPos, 196, yPos);
      yPos += 3;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(76, 175, 80);
      doc.text(cleanTurkish('NET ODENEN UCRET:'), 16, yPos);
      doc.text(`$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 120, yPos);
      
      // Alt taraf notlar
      yPos = 260;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      doc.text(cleanTurkish(`Durum: ${p.status === 'Paid' ? 'ODENDI' : 'BEKLIYOR'}`), 14, yPos);
      doc.text(cleanTurkish(`Odeme Tarihi: ${p.payment_date || '-'}`), 14, yPos + 4);
      doc.text(cleanTurkish(`Odeme Yontemi: ${p.payment_method || '-'}`), 14, yPos + 8);
      
      if (p.notes) {
        doc.text(cleanTurkish(`Notlar: ${p.notes}`), 14, yPos + 12);
      }
    });
    
    doc.save(`bordro_detayli_${month}.pdf`);
  } catch (error) {
    console.error('Bordro detayli export hatasi:', error);
    alert('Export hatasi: ' + error.message);
  }
};
