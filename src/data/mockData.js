import { Users } from 'lucide-react';

// --- ÇALIŞAN VERİLERİ ---
export const employeesData = [
  {
    id: 1,
    employeeId: 'EMP1001',
    name: 'Ali Yılmaz',
    position: 'Senior Frontend Dev',
    department: 'Engineering',
    email: 'ali.yilmaz@paymaki.com',
    phone: '+90 555 111 2233',
    status: 'Active',
    avatar: 'AY',
    salary: 95000,
    startDate: '2023-01-15',
    performance: 4.8
  },
  {
    id: 2,
    employeeId: 'EMP1002',
    name: 'Ayşe Demir',
    position: 'Product Manager',
    department: 'Product',
    email: 'ayse.demir@paymaki.com',
    phone: '+90 555 222 3344',
    status: 'Active',
    avatar: 'AD',
    salary: 110000,
    startDate: '2023-03-10',
    performance: 4.5
  },
  {
    id: 3,
    employeeId: 'EMP1003',
    name: 'Mehmet Kaya',
    position: 'UX Designer',
    department: 'Design',
    email: 'mehmet.kaya@paymaki.com',
    phone: '+90 555 333 4455',
    status: 'Active',
    avatar: 'MK',
    salary: 88000,
    startDate: '2024-06-01',
    performance: 4.2
  },
  {
    id: 4,
    employeeId: 'EMP1004',
    name: 'Zeynep Çelik',
    position: 'HR Specialist',
    department: 'HR',
    email: 'zeynep.celik@paymaki.com',
    phone: '+90 555 444 5566',
    status: 'On Leave',
    avatar: 'ZÇ',
    salary: 75000,
    startDate: '2024-01-20',
    performance: 4.9
  },
  {
    id: 5,
    employeeId: 'EMP1005',
    name: 'Can Vural',
    position: 'Backend Developer',
    department: 'Engineering',
    email: 'can.vural@paymaki.com',
    phone: '+90 555 666 7788',
    status: 'Active',
    avatar: 'CV',
    salary: 92000,
    startDate: '2023-11-15',
    performance: 4.0
  }
];

// --- MAAŞ VERİLERİ (Payroll.jsx için kritik!) ---
export const payrollData = [
  { 
    id: 101, 
    employeeId: 1, 
    period: 'Ocak 2026', 
    base_salary: 95000, 
    net: 71250, 
    status: 'Paid',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
  { 
    id: 102, 
    employeeId: 2, 
    period: 'Ocak 2026', 
    base_salary: 110000, 
    net: 82500, 
    status: 'Processing',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
  { 
    id: 103, 
    employeeId: 3, 
    period: 'Ocak 2026', 
    base_salary: 88000, 
    net: 66000, 
    status: 'Paid',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 800 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 500 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 1500 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Ek Kesinti', type: 'fixed', value: 2100 },
    ]
  },
  { 
    id: 104, 
    employeeId: 4, 
    period: 'Ocak 2026', 
    base_salary: 75000, 
    net: 56250, 
    status: 'Processing',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
  { 
    id: 105, 
    employeeId: 5, 
    period: 'Ocak 2026', 
    base_salary: 92000, 
    net: 69000, 
    status: 'Paid',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
  
  // Geçmiş aylar
  { 
    id: 201, 
    employeeId: 1, 
    period: 'Aralık 2025', 
    base_salary: 95000, 
    net: 71250, 
    status: 'Paid',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
  { 
    id: 202, 
    employeeId: 2, 
    period: 'Aralık 2025', 
    base_salary: 110000, 
    net: 82500, 
    status: 'Paid',
    earnings_details: [
      { id: 'bonus', name: 'İkramiye / Bonus', type: 'fixed', value: 0 },
      { id: 'overtime', name: 'Fazla Mesai', type: 'fixed', value: 0 },
      { id: 'commission', name: 'Komisyon', type: 'fixed', value: 0 },
      { id: 'premium', name: 'Prim', type: 'fixed', value: 0 },
      { id: 'tip', name: 'Bahşiş (Tip)', type: 'fixed', value: 0 },
    ],
    deductions_details: [
      { id: 'sgk', name: 'SGK İşçi Payı', type: 'percent', value: 14 },
      { id: 'unemployment', name: 'İşsizlik Sigortası', type: 'percent', value: 1 },
      { id: 'income_tax', name: 'Gelir Vergisi', type: 'percent', value: 15 },
      { id: 'stamp_tax', name: 'Damga Vergisi', type: 'percent', value: 0.759 },
      { id: 'advance', name: 'Avans Kesintisi', type: 'fixed', value: 0 },
    ]
  },
];

// --- BİLDİRİM VERİLERİ ---
export const notificationsData = [
  { 
    id: 1, 
    title: 'Yeni İzin Talebi', 
    message: 'Ali Yılmaz 3 günlük yıllık izin talep etti.', 
    time: '10 dk önce', 
    type: 'warning', 
    isRead: false,
    targetRole: ['general_manager', 'hr'] // Sadece GM ve HR görsün
  },
  { 
    id: 2, 
    title: 'Maaş Ödemesi Tamamlandı', 
    message: 'Ocak 2026 dönemi maaşları başarıyla yatırıldı.', 
    time: '2 saat önce', 
    type: 'success', 
    isRead: false,
    targetRole: ['general_manager', 'hr', 'employee'] // Herkes görsün
  },
  { 
    id: 3, 
    title: 'Sistem Bakımı', 
    message: 'Gece 03:00\'te sistem bakımı yapılacaktır.', 
    time: '1 gün önce', 
    type: 'system', 
    isRead: true,
    targetRole: ['general_manager', 'hr', 'employee']
  },
  { 
    id: 4, 
    title: 'Bütçe Raporu Hazır', 
    message: '2025 Q4 Finansal raporları onayınızı bekliyor.', 
    time: '30 dk önce', 
    type: 'info', 
    isRead: false,
    targetRole: ['general_manager'] // Sadece GM görsün
  }
];