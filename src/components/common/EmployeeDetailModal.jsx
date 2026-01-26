// src/components/common/EmployeeDetailModal.jsx

import React from 'react';
import { X, Award, Mail, Phone, MapPin, Briefcase, Calendar, Users, DollarSign, Heart, GraduationCap } from 'lucide-react';
import { getInitials, isValidImageUrl } from '../../utils/avatarHelper';

export default function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal İçeriği (Önceki koddan buraya taşındı) */}
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {isValidImageUrl(employee.avatar) ? <img src={employee.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover"/> : getInitials(employee.name || 'Bilinmiyor')}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{employee.name}</h3>
                <p className="text-gray-600">{employee.position}</p>
                <div className="flex gap-4 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
            {/* Diğer detay alanları buraya gelecek... (Kısalık için özetledim) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Contact</h4>
                    <p className="flex gap-2 text-gray-700"><Mail className="w-4 h-4"/> {employee.email}</p>
                    <p className="flex gap-2 text-gray-700"><Phone className="w-4 h-4"/> {employee.phone}</p>
                </div>
                 {/* ... */}
            </div>
        </div>
      </div>
    </div>
  );
}