import { HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StorageIndicator() {
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    const updateStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      }
    };

    updateStorage();
    const interval = setInterval(updateStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!storage) return null;

  const usagePercent = (storage.used / storage.quota) * 100;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <HardDrive className="h-4 w-4" />
        <span>Storage</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {formatBytes(storage.used)} / {formatBytes(storage.quota)}
      </p>
    </div>
  );
}
