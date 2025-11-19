import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
       <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-t-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3.314C11.332 1.98 13.56 1.5 15.25 2.5c2.315 1.397 3.25 4.31 1.94 6.554C15.93 11.23 12.28 14 10 16.5c-2.28-2.5-5.93-5.27-7.19-7.446C1.5 6.81 2.435 3.897 4.75 2.5 6.44 1.5 8.668 1.98 10 3.314z" clipRule="evenodd" />
        </svg>
        </div>
      </div>
      <p className="text-lg text-indigo-700 font-semibold animate-pulse">در حال آماده‌سازی پاسخ...</p>
    </div>
  );
};

export default LoadingSpinner;