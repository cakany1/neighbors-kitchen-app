interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VerificationBadge = ({ isVerified, size = 'md' }: VerificationBadgeProps) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-sm',
    lg: 'w-5 h-5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses[size]} text-blue-500 font-bold`}
      title="Verified User (Phone or ID verified)"
    >
      ✓
    </span>
  );
};
