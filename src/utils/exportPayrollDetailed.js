import jsPDF from 'jspdf';

// Payroll Export - ÖZET Formatı
export const exportPayrollToPDF_Summary = (payrolls, month) => {
  try {
    if (!payrolls || payrolls.length === 0) {
      alert('Exportlamak için bordro verisi yok!');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text('BORDRO RAPORU (OZET)', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Donem: ${month}`, 14, 30);
    
    // Manuel tablo
    let yPos = 50;
    const columns = ['Calisan', 'Aylik Maas', 'Kazanclar', 'Kesintiler', 'Net Maas', 'Durum'];
    const colWidth = 30;
    
    // Header
    doc.setFillColor(34, 197, 94);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    columns.forEach((col, i) => {
      doc.text(col, 14 + i * colWidth, yPos);
    });
    
    // İçerik
    yPos += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      return item.type === 'percent' ? (salary * val) / 100 : val;
    };
    
    payrolls.forEach(p => {
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const totalDeductions = (p.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      const cleanName = (p.employees?.name || p.employee_name || 'Bilinmiyor')
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').toUpperCase();
      
      const row = [
        cleanName,
        `$${baseSalary.toLocaleString()}`,
        `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        p.status === 'Paid' ? 'ODENDI' : 'BEKLIYOR'
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
    
    doc.save(`bordro_ozet_${month}.pdf`);
  } catch (error) {
    console.error('Bordro export hatası:', error);
    alert('Export hatası: ' + error.message);
  }
};

// Payroll Export - DETAYLI Formatı
export const exportPayrollToPDF_Detailed = (payrolls, month) => {
  try {
    if (!payrolls || payrolls.length === 0) {
      alert('Exportlamak için bordro verisi yok!');
      return;
    }

    const doc = new jsPDF();
    
    const calculateItemAmount = (item, salary) => {
      const val = parseFloat(item.value) || 0;
      return item.type === 'percent' ? (salary * val) / 100 : val;
    };
    
    const cleanText = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').toUpperCase();
    };
    
    payrolls.forEach((p, idx) => {
      if (idx > 0) doc.addPage();
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AYRINTILI BORDRO', 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Donem: ${month}`, 14, 30);
      doc.text(`Calisan: ${cleanText(p.employees?.name || p.employee_name || 'Bilinmiyor')}`, 14, 37);
      doc.text(`Bolum: ${cleanText(p.department || p.employees?.department || '-')}`, 14, 44);
      
      let yPos = 55;
      const baseSalary = p.base_salary || 0;
      const totalEarnings = (p.earnings_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const totalDeductions = (p.deductions_details || []).reduce((acc, item) => acc + calculateItemAmount(item, baseSalary), 0);
      const netPay = baseSalary + totalEarnings - totalDeductions;
      
      // Temel Bilgi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TEMEL MAAS:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`$${baseSalary.toLocaleString()}`, 60, yPos);
      
      yPos += 10;
      
      // Kazançlar
      if (p.earnings_details && p.earnings_details.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('KAZANCLAR:', 14, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        p.earnings_details.forEach(item => {
          const amount = calculateItemAmount(item, baseSalary);
          const label = cleanText(item.name);
          const typeStr = item.type === 'percent' ? `${item.value}%` : `$${item.value}`;
          doc.text(`  - ${label} (${typeStr}): $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
          yPos += 6;
        });
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Toplam Kazanclar: $${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
        yPos += 10;
      }
      
      // Kesintiler
      if (p.deductions_details && p.deductions_details.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('KESINTILER:', 14, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        p.deductions_details.forEach(item => {
          const amount = calculateItemAmount(item, baseSalary);
          const label = cleanText(item.name);
          const typeStr = item.type === 'percent' ? `${item.value}%` : `$${item.value}`;
          doc.text(`  - ${label} (${typeStr}): $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
          yPos += 6;
        });
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Toplam Kesintiler: $${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
        yPos += 10;
      }
      
      // Özet
      doc.setLineWidth(0.5);
      doc.line(14, yPos - 2, 196, yPos - 2);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`NET MAAS (Odenecek): $${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos + 5);
      
      yPos += 15;
      doc.setFontSize(10);
      doc.text(`Durum: ${p.status === 'Paid' ? 'ODENDI' : 'BEKLIYOR'}`, 14, yPos);
      
      if (p.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos += 8;
        doc.text(`Notlar: ${cleanText(p.notes)}`, 14, yPos);
      }
    });
    
    doc.save(`bordro_detayli_${month}.pdf`);
  } catch (error) {
    console.error('Bordro detaylı export hatası:', error);
    alert('Export hatası: ' + error.message);
  }
};
