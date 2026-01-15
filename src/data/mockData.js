// src/data/mockData.js

export const employeesData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    email: 'sarah.johnson@company.com',
    phone: '(555) 123-4567',
    address: '123 Main St, San Francisco, CA 94102',
    salary: 125000,
    startDate: '2022-03-15',
    birthDate: '1990-05-20',
    status: 'Active',
    employeeId: 'EMP001',
    manager: 'John Smith',
    ptoBalance: 15,
    sickLeave: 8,
    avatar: 'SJ',
    emergencyContact: 'Mike Johnson - (555) 111-2222',
    education: 'BS Computer Science - Stanford University',
    performance: 4.5,
    benefits: ['Health Insurance', 'Dental', '401k', 'Stock Options']
  },
  {
    id: 2,
    name: 'Michael Chen',
    position: 'Product Manager',
    department: 'Product',
    email: 'michael.chen@company.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, San Francisco, CA 94103',
    salary: 115000,
    startDate: '2021-07-01',
    birthDate: '1988-11-12',
    status: 'Active',
    employeeId: 'EMP002',
    manager: 'Lisa Anderson',
    ptoBalance: 12,
    sickLeave: 5,
    avatar: 'MC',
    emergencyContact: 'Jenny Chen - (555) 222-3333',
    education: 'MBA - UC Berkeley',
    performance: 4.8,
    benefits: ['Health Insurance', 'Dental', '401k']
  },
  // Diğer çalışanları buraya ekleyebilirsiniz...
];

export const timeEntriesData = [
  { id: 1, employeeId: 1, date: '2026-01-13', clockIn: '09:00', clockOut: '17:30', hoursWorked: 8, status: 'Approved' },
  { id: 2, employeeId: 1, date: '2026-01-14', clockIn: '09:15', clockOut: '17:45', hoursWorked: 8.5, status: 'Approved' },
  // ...
];

export const leaveRequestsData = [
  { id: 1, employeeId: 1, type: 'PTO', startDate: '2026-02-10', endDate: '2026-02-14', status: 'Pending', days: 5, reason: 'Family vacation' },
  { id: 2, employeeId: 2, type: 'Sick Leave', startDate: '2026-01-20', endDate: '2026-01-20', status: 'Approved', days: 1, reason: 'Medical appointment' },
  // ...
];

export const payrollData = [
  { id: 1, employeeId: 1, period: 'Jan 2026', gross: 10416.67, deductions: 2187.50, net: 8229.17, status: 'Paid' },
  { id: 2, employeeId: 2, period: 'Jan 2026', gross: 9583.33, deductions: 2012.50, net: 7570.83, status: 'Paid' },
  // ...
];

export const documentsData = [
  { id: 1, employeeId: 1, name: 'Employment Contract.pdf', type: 'Contract', uploadDate: '2022-03-15', size: '245 KB' },
  { id: 2, employeeId: 1, name: 'W-4 Form.pdf', type: 'Tax', uploadDate: '2022-03-15', size: '128 KB' },
  // ...
];