'use client';

/**
 * Architecture Diagram Component
 */

import { memo } from 'react';

interface ArchitectureDiagramProps {
  title?: string;
  description?: string;
}

function ArchitectureDiagram({ title = 'System Architecture', description }: ArchitectureDiagramProps) {
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg" role="img" aria-label={title}>
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <svg className="w-full h-80" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Frontend Layer */}
        <rect x="50" y="20" width="200" height="80" rx="8" fill="#0ea5e9" fillOpacity="0.1" stroke="#0ea5e9" strokeWidth="2" />
        <text x="150" y="60" textAnchor="middle" fill="#0ea5e9" fontWeight="bold">Frontend</text>
        <text x="150" y="80" textAnchor="middle" fill="#0ea5e9" fontSize="12">React + Next.js</text>
        
        {/* API Layer */}
        <rect x="300" y="20" width="200" height="80" rx="8" fill="#0ea5e9" fillOpacity="0.1" stroke="#0ea5e9" strokeWidth="2" />
        <text x="400" y="60" textAnchor="middle" fill="#0ea5e9" fontWeight="bold">API Layer</text>
        <text x="400" y="80" textAnchor="middle" fill="#0ea5e9" fontSize="12">AI Service</text>
        
        {/* AI Models */}
        <rect x="550" y="20" width="200" height="80" rx="8" fill="#0ea5e9" fillOpacity="0.1" stroke="#0ea5e9" strokeWidth="2" />
        <text x="650" y="60" textAnchor="middle" fill="#0ea5e9" fontWeight="bold">AI Models</text>
        <text x="650" y="80" textAnchor="middle" fill="#0ea5e9" fontSize="12">OpenAI / Claude</text>
        
        {/* Cache Layer */}
        <rect x="300" y="140" width="200" height="80" rx="8" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="2" />
        <text x="400" y="180" textAnchor="middle" fill="#10b981" fontWeight="bold">Cache Layer</text>
        <text x="400" y="200" textAnchor="middle" fill="#10b981" fontSize="12">Redis / LRU</text>
        
        {/* Monitoring */}
        <rect x="50" y="240" width="200" height="60" rx="8" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2" />
        <text x="150" y="275" textAnchor="middle" fill="#f59e0b" fontWeight="bold">Monitoring</text>
        
        {/* Metrics */}
        <rect x="300" y="240" width="200" height="60" rx="8" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2" />
        <text x="400" y="275" textAnchor="middle" fill="#f59e0b" fontWeight="bold">Metrics</text>
        
        {/* Arrows */}
        <path d="M 250 60 L 300 60" stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 500 60 L 550 60" stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 400 100 L 400 140" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#0ea5e9" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export default memo(ArchitectureDiagram);
