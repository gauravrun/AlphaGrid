import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const ChartCard = ({ title, subtitle, children, actions }: ChartCardProps) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
