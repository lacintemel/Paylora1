// src/views/Dashboard.jsx
import React from 'react';
import { Users, CheckCircle, AlertCircle, Award, Download, Plus, TrendingUp, Clock, FileText } from 'lucide-react';
import { employeesData, leaveRequestsData, timeEntriesData, documentsData } from '../data/mockData';

export default function Dashboard() {
  const totalPayroll = employeesData.reduce((sum, emp) => sum + emp.salary, 0);
  const avgPerformance = (employeesData.reduce((sum, emp) => sum + emp.performance, 0) / employeesData.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        {/* Butonlar */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Kartlar */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between">
                <div>
                    <p className="text-blue-100 text-sm">Total Employees</p>
                    <p className="text-4xl font-bold mt-2">{employeesData.length}</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
            </div>
        </div>
        {/* Diğer kartlar... */}
      </div>
      
      {/* Grafikler ve Özetler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* ... */}
      </div>
    </div>
  );
}