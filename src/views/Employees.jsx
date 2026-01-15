// src/views/Employees.jsx
import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Briefcase, Users, Mail, Phone, Award, Edit2 } from 'lucide-react';
import { employeesData } from '../data/mockData';
import EmployeeDetailModal from '../components/common/EmployeeDetailModal';

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const departments = [...new Set(employeesData.map(e => e.department))];

  const filteredEmployees = employeesData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header ve Filtreler */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-lg px-4"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
      </div>

      {/* Çalışan Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{emp.avatar}</div>
                   <div>
                       <h3 className="font-bold">{emp.name}</h3>
                       <p className="text-sm text-gray-500">{emp.position}</p>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => setSelectedEmployee(emp)}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg mt-4 text-sm font-medium hover:bg-blue-100"
             >
                 View Details
             </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal 
            employee={selectedEmployee} 
            onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}