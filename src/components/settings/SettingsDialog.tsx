import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUIStore } from '@/stores';
import { AccessibilitySettings } from './AccessibilitySettings';

export function SettingsDialog() {
  const { settingsDialogOpen, closeSettingsDialog } = useUIStore();

  return (
    <Dialog open={settingsDialogOpen} onOpenChange={(open) => !open && closeSettingsDialog()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <AccessibilitySettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}
