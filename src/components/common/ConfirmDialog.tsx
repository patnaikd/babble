import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores';
import { useDocuments } from '@/hooks/useDocuments';

export function DeleteConfirmDialog() {
  const { deleteConfirmOpen, deleteTargetId, closeDeleteConfirm } = useUIStore();
  const { deleteDocument, documents } = useDocuments();

  const targetDoc = documents.find(d => d.id === deleteTargetId);

  const handleConfirm = async () => {
    if (deleteTargetId) {
      await deleteDocument(deleteTargetId);
      closeDeleteConfirm();
    }
  };

  return (
    <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !open && closeDeleteConfirm()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{targetDoc?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeDeleteConfirm}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
