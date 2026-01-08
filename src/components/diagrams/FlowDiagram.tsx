'use client';

/**
 * Flow Diagram Component
 */

import { memo } from 'react';

interface FlowDiagramProps {
  title?: string;
  description?: string;
}

function FlowDiagram({ title = 'Request Flow', description }: FlowDiagramProps) {
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg" role="img" aria-label={title}>
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      
      <svg className="w-full h-80" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Request */}
        <rect x="50" y="20" width="120" height="50" rx="25" fill="#3b82f6" />
        <text x="110" y="50" textAnchor="middle" fill="white" fontWeight="bold">Request</text>
        
        {/* Cache Check */}
        <polygon points="250,45 300,20 350,45 300,70" fill="#10b981" />
        <text x="300" y="50" textAnchor="middle" fill="white" fontSize="12">Cache?</text>
        
        {/* Cache Hit */}
        <rect x="400" y="20" width="120" height="50" rx="8" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
        <text x="460" y="50" textAnchor="middle" fill="#10b981" fontWeight="bold">Return</text>
        
        {/* AI Process */}
        <rect x="230" y="120" width="140" height="50" rx="8" fill="#f59e0b" />
        <text x="300" y="150" textAnchor="middle" fill="white" fontWeight="bold">AI Processing</text>
        
        {/* Retry Logic */}
        <rect x="230" y="200" width="140" height="50" rx="8" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
        <text x="300" y="225" textAnchor="middle" fill="#ef4444" fontSize="12">Retry Logic</text>
        <text x="300" y="240" textAnchor="middle" fill="#ef4444" fontSize="10">(if needed)</text>
        
        {/* Response */}
        <rect x="400" y="120" width="120" height="50" rx="25" fill="#3b82f6" />
        <text x="460" y="150" textAnchor="middle" fill="white" fontWeight="bold">Response</text>
        
        {/* Arrows */}
        <path d="M 170 45 L 250 45" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
        <path d="M 350 45 L 400 45" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow)" />
        <path d="M 300 70 L 300 120" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
        <path d="M 370 145 L 400 145" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
        <path d="M 300 170 L 300 200" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
        <path d="M 230 225 L 200 225 L 200 145 L 230 145" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrow)" />
        
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

export default memo(FlowDiagram);
