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
  { id: 101, employeeId: 1, period: 'Ocak 2026', salary: 95000, net: 71250, status: 'Paid' },
  { id: 102, employeeId: 2, period: 'Ocak 2026', salary: 110000, net: 82500, status: 'Processing' },
  { id: 103, employeeId: 3, period: 'Ocak 2026', salary: 88000, net: 66000, status: 'Paid' },
  { id: 104, employeeId: 4, period: 'Ocak 2026', salary: 75000, net: 56250, status: 'Processing' },
  { id: 105, employeeId: 5, period: 'Ocak 2026', salary: 92000, net: 69000, status: 'Paid' },
  
  // Geçmiş aylar
  { id: 201, employeeId: 1, period: 'Aralık 2025', salary: 95000, net: 71250, status: 'Paid' },
  { id: 202, employeeId: 2, period: 'Aralık 2025', salary: 110000, net: 82500, status: 'Paid' },
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