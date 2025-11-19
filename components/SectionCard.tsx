import React from 'react';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, actions }) => {
  return (
    <div className="rounded-2xl p-px bg-gradient-to-br from-indigo-300/50 via-purple-300/50 to-white/50 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1.5">
      <div className="bg-white/80 backdrop-blur-lg rounded-[15px] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 rounded-full p-3 mr-4 ml-2 shadow-inner shadow-indigo-500/10">
                {icon}
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-gray-700 truncate">{title}</h2>
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
          <div className="text-gray-700 leading-relaxed space-y-3 pl-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;