'use client';

/**
 * Data Diagram Component
 */

import { memo } from 'react';

interface DataDiagramProps {
  title?: string;
  description?: string;
}

function DataDiagram({ title = 'Data Flow', description }: DataDiagramProps) {
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg" role="img" aria-label={title}>
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <svg className="w-full h-80" viewBox="0 0 700 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* User Input */}
        <circle cx="100" cy="60" r="40" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" />
        <text x="100" y="65" textAnchor="middle" fill="#6366f1" fontWeight="bold">User</text>
        
        {/* Sanitization */}
        <rect x="200" y="30" width="140" height="60" rx="8" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="2" />
        <text x="270" y="55" textAnchor="middle" fill="#10b981" fontWeight="bold">Sanitization</text>
        <text x="270" y="75" textAnchor="middle" fill="#10b981" fontSize="12">Input Validation</text>
        
        {/* Token Counting */}
        <rect x="200" y="120" width="140" height="60" rx="8" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2" />
        <text x="270" y="145" textAnchor="middle" fill="#f59e0b" fontWeight="bold">Token Count</text>
        <text x="270" y="165" textAnchor="middle" fill="#f59e0b" fontSize="12">Truncation</text>
        
        {/* AI Model */}
        <rect x="400" y="75" width="140" height="60" rx="8" fill="#3b82f6" />
        <text x="470" y="105" textAnchor="middle" fill="white" fontWeight="bold">AI Model</text>
        
        {/* Output Sanitization */}
        <rect x="200" y="210" width="140" height="60" rx="8" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="2" />
        <text x="270" y="235" textAnchor="middle" fill="#10b981" fontWeight="bold">Output</text>
        <text x="270" y="255" textAnchor="middle" fill="#10b981" fontSize="12">Sanitization</text>
        
        {/* Response */}
        <circle cx="600" cy="240" r="40" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" />
        <text x="600" y="245" textAnchor="middle" fill="#6366f1" fontWeight="bold">Output</text>
        
        {/* Arrows */}
        <path d="M 140 60 L 200 60" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowData)" />
        <path d="M 270 90 L 270 120" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowData)" />
        <path d="M 340 150 L 400 105" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowData)" />
        <path d="M 470 135 L 470 180 L 340 240" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowData)" />
        <path d="M 340 240 L 560 240" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowData)" />
        
        <defs>
          <marker id="arrowData" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export default memo(DataDiagram);
