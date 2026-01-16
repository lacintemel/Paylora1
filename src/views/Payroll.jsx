// src/views/Payroll.jsx
import React from 'react';
import { Download, DollarSign } from 'lucide-react';
import { payrollData, employeesData } from '../data/mockData';

export default function Payroll() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Payroll</h1>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
                <DollarSign className="w-4 h-4" /> Process Payroll
            </button>
        </div>
      </div>
      
      {/* Tablo */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <th className="text-left py-4 px-6">Employee</th>
                    <th className="text-left py-4 px-6">Gross Pay</th>
                    <th className="text-left py-4 px-6">Net Pay</th>
                    <th className="text-left py-4 px-6">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {payrollData.map(pay => {
                    const emp = employeesData.find(e => e.id === pay.employeeId);
                    return (
                        <tr key={pay.id}>
                            <td className="py-4 px-6 font-medium">{emp?.name}</td>
                            <td className="py-4 px-6">${pay.gross.toLocaleString()}</td>
                            <td className="py-4 px-6 text-green-600 font-bold">${pay.net.toLocaleString()}</td>
                            <td className="py-4 px-6">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    {pay.status}
                                </span>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
}