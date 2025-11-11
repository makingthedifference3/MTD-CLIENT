import { useState } from 'react';
import { getCompanyLogo, getFallbackLogo, extractDomain, type LogoOptions } from '../lib/logodev';

interface CompanyLogoProps {
  website: string;
  companyName: string;
  size?: number;
  className?: string;
  options?: LogoOptions;
}

export default function CompanyLogo({ 
  website, 
  companyName, 
  size = 200, 
  className = '',
  options = {}
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const domain = extractDomain(website);
  const logoUrl = getCompanyLogo(domain, { size, ...options });
  const fallbackUrl = getFallbackLogo(companyName);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={imageError ? fallbackUrl : logoUrl}
        alt={`${companyName} logo`}
        className={`w-full h-full object-contain rounded-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}
