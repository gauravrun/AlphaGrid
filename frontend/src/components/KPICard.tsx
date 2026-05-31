import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'orange' | 'gray';
  suffix?: string;
}

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  suffix 
}: KPICardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    gray: 'bg-gray-50 text-gray-700',
  };
  
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };
  
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <div className={`text-3xl font-bold ${trend ? trendColors[trend] : 'text-gray-900'}`}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </div>
        {suffix && <span className="text-lg text-gray-500">{suffix}</span>}
      </div>
      
      {subtitle && (
        <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
      )}
    </div>
  );
};

export default KPICard;
