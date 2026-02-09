import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export function AppVersionBadge() {
  const [version, setVersion] = useState<string>('1.1.0');

  useEffect(() => {
    // In production, this could come from package.json or capacitor.config.ts
    // For now, we hardcode the version that matches capacitor.config.ts
    setVersion('1.1.0');
  }, []);

  return (
    <Badge variant="outline" className="text-xs">
      v{version}
    </Badge>
  );
}

export default AppVersionBadge;
