import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/stores';
import { useDocuments } from '@/hooks/useDocuments';

export function RenameDialog() {
  const { renameDialogOpen, renameTargetId, closeRenameDialog } = useUIStore();
  const { renameDocument, documents } = useDocuments();
  const [name, setName] = useState('');

  const targetDoc = documents.find(d => d.id === renameTargetId);

  useEffect(() => {
    if (targetDoc) {
      setName(targetDoc.name);
    }
  }, [targetDoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (renameTargetId && name.trim()) {
      await renameDocument(renameTargetId, name.trim());
      closeRenameDialog();
    }
  };

  return (
    <Dialog open={renameDialogOpen} onOpenChange={(open) => !open && closeRenameDialog()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Document name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRenameDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
