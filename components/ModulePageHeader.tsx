import React from 'react';

interface ModulePageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  className?: string;
}

const ModulePageHeader: React.FC<ModulePageHeaderProps> = ({ title, subtitle, actions, className = '' }) => (
  <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    {actions}
  </div>
);

export default ModulePageHeader;
