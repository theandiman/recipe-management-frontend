import React from 'react'

export const StatsSkeleton: React.FC = () => (
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse w-20"></div>
      <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse w-12"></div>
    </div>
    <div className="p-3 rounded-full bg-gray-50">
      <div className="w-5 h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
)