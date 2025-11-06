import React from 'react';
import { motion } from 'framer-motion';

interface ProgressChartProps {
  data: Array<{
    date: string;
    confidence: number;
    emotionalState: any;
  }>;
  className?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-senior p-6 shadow-senior ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Gráfico de Progreso
        </h3>
        <div className="text-center text-gray-500 py-8">
          No hay datos suficientes para mostrar el gráfico
        </div>
      </div>
    );
  }

  const maxConfidence = 10;
  const chartHeight = 200;
  const chartWidth = 300;
  const padding = 40;

  // Calculate points for the line chart
  const points = data.map((entry, index) => {
    const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
    const y = chartHeight - padding - ((entry.confidence / maxConfidence) * (chartHeight - 2 * padding));
    return { x, y, confidence: entry.confidence, date: entry.date };
  });

  // Create path string for SVG
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <div className={`bg-white rounded-senior p-6 shadow-senior ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Progreso de Confianza
      </h3>
      
      <div className="relative">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="mx-auto"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Grid lines */}
          {[2, 4, 6, 8, 10].map((value) => {
            const y = chartHeight - padding - ((value / maxConfidence) * (chartHeight - 2 * padding));
            return (
              <g key={value}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Chart line */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="#6B73FF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#6B73FF"
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="cursor-pointer hover:r-8 transition-all"
            >
              <title>
                {new Date(point.date).toLocaleDateString('es-ES')} - Confianza: {point.confidence}
              </title>
            </motion.circle>
          ))}

          {/* Axes */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#374151"
            strokeWidth="2"
          />
        </svg>

        {/* Date labels */}
        <div className="flex justify-between mt-2 px-10 text-xs text-gray-500">
          <span>{new Date(data[0]?.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
          <span>{new Date(data[data.length - 1]?.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          <span>Nivel de Confianza (1-10)</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;