import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  UserPlus, 
  Settings, 
  Calendar,
  Clock
} from 'lucide-react';

const ROLES = {
  GM: 'general_manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
};

export const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: [ROLES.GM, ROLES.HR, ROLES.EMPLOYEE]
  },
  {
    id: 'employees',
    label: 'Çalışanlar',
    icon: Users,
    allowedRoles: [ROLES.GM, ROLES.HR]
  },
  {
    id: 'time-tracking',
    label: 'Zaman Takibi',
    icon: Clock,
    allowedRoles: [ROLES.GM, ROLES.HR, ROLES.EMPLOYEE]
  },
  {
    id: 'leave',
    label: 'İzin Yönetimi',
    icon: Calendar,
    allowedRoles: [ROLES.GM, ROLES.HR, ROLES.EMPLOYEE]
  },
  {
    id: 'payroll',
    label: 'Maaş & Bordro',
    icon: CreditCard,
    allowedRoles: [ROLES.GM, ROLES.HR]
  },
  {
    id: 'recruitment',
    label: 'İşe Alım',
    icon: UserPlus,
    allowedRoles: [ROLES.GM, ROLES.HR]
  },
  {
    id: 'documents',
    label: 'Belgelerim',
    icon: FileText,
    allowedRoles: [ROLES.EMPLOYEE, ROLES.HR] // HR da kendi belgesini görebilsin
  },
  {
    id: 'settings',
    label: 'Şirket Ayarları',
    icon: Settings,
    allowedRoles: [ROLES.GM]
  }
];