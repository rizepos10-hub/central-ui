import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface DraggableListProps {
  value: any[];
  onChange: (event: { value: any[] }) => void;
  itemTemplate: (item: any, index: number) => React.ReactNode;
  header?: React.ReactNode;
  dataKey: string;
  dragdrop?: boolean;
  showArrows?: boolean;
  selectable?: boolean;
}

export const DraggableList: React.FC<DraggableListProps> = ({
  value,
  onChange,
  itemTemplate,
  header,
  dataKey,
  dragdrop = true,
  showArrows = true,
  selectable = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!dragdrop) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!dragdrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    if (!dragdrop) return;
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!dragdrop) return;
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newValue = [...value];
    const draggedItem = newValue[draggedIndex];

    newValue.splice(draggedIndex, 1);
    newValue.splice(dropIndex, 0, draggedItem);

    onChange({ value: newValue });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (!dragdrop) return;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === 0) return;

    const newValue = [...value];
    const temp = newValue[index - 1];
    newValue[index - 1] = newValue[index];
    newValue[index] = temp;

    onChange({ value: newValue });
  };

  const moveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === value.length - 1) return;

    const newValue = [...value];
    const temp = newValue[index + 1];
    newValue[index + 1] = newValue[index];
    newValue[index] = temp;

    onChange({ value: newValue });
  };

  const handleRowClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  return (
    <div className="border rounded">
      {header && (
        <div className="p-2 border-b bg-muted/30">
          {header}
        </div>
      )}
      <div className="divide-y">
        {value.map((item, index) => (
          <div
            key={item[dataKey]}
            draggable={dragdrop}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={selectable ? () => handleRowClick(index) : undefined}
            className={`
              p-2 transition-colors
              ${dragdrop ? 'cursor-move' : selectable ? 'cursor-pointer' : ''}
              ${selectable && selectedIndex === index ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/50'}
              ${draggedIndex === index ? 'opacity-50' : ''}
              ${dragOverIndex === index ? 'border-t-2 border-primary' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {showArrows && (
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-muted"
                    onClick={(e) => moveUp(e, index)}
                    disabled={index === 0}
                    type="button"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-muted"
                    onClick={(e) => moveDown(e, index)}
                    disabled={index === value.length - 1}
                    type="button"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {dragdrop && <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <div className="flex-1">
                {itemTemplate(item, index)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraggableList;
