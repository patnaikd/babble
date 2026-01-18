import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({
  toast,
  onClose
}: {
  toast: { id: string; title: string; description?: string; variant?: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "bg-background border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]",
      "animate-in slide-in-from-right-full",
      toast.variant === 'destructive' && "border-destructive"
    )}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className={cn(
            "font-semibold",
            toast.variant === 'destructive' && "text-destructive"
          )}>
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
