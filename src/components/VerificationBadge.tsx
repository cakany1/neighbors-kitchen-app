import { BadgeCheck } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VerificationBadge = ({ isVerified, size = 'md' }: VerificationBadgeProps) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <BadgeCheck 
      className={`${sizeClasses[size]} text-blue-500 fill-blue-500/20`}
      aria-label="Verified User"
    />
  );
};
