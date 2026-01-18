import { AppLayout } from '@/components/layout';
import { DeleteConfirmDialog, RenameDialog, Toaster } from '@/components/common';
import { SettingsDialog } from '@/components/settings';
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores';

function App() {
  const { theme } = useSettingsStore();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'dark' || theme === 'high-contrast') {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  return (
    <>
      <AppLayout />
      <DeleteConfirmDialog />
      <RenameDialog />
      <SettingsDialog />
      <Toaster />
    </>
  );
}

export default App;
