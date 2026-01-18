import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DocumentItem } from './DocumentItem';
import { useDocuments } from '@/hooks/useDocuments';

export function DocumentList() {
  const { documents, reorderDocuments } = useDocuments();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = documents.findIndex(d => d.id === active.id);
      const newIndex = documents.findIndex(d => d.id === over.id);
      const newOrder = arrayMove(documents, oldIndex, newIndex);
      reorderDocuments(newOrder.map(d => d.id));
    }
  };

  if (documents.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No documents yet.</p>
        <p className="text-sm">Click + to create one.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={documents.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2">
          {documents.map((doc) => (
            <DocumentItem key={doc.id} document={doc} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
