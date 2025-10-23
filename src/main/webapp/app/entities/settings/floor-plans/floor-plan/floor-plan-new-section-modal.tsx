import React, { useState } from 'react';
import { Translate } from "react-jhipster";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SectionModal = ({ isOpen, onClose, onAddSection, initialDimensions }) => {
  console.log(initialDimensions, 'initialDimensions')
  const [newSection, setNewSection] = useState({
    name: '',
    dimensions: {
      ...initialDimensions
    },
    visible: false,
    backgroundImage: null,
  });

  const removeImage = () => {
    setNewSection((prev) => ({
      ...prev,
      backgroundImage: null,
    }));
  };

  const addImage = (imageInfo) => {
    setNewSection((prev) => ({
      ...prev,
      backgroundImage: imageInfo,
    }));
  };

  const handleAddSection = () => {
    if (newSection.name.trim() === '') {
      alert('Please enter section name');
      return;
    }
    onAddSection(newSection);
    setNewSection({
      name: '',
      dimensions: {
        width: null,
        height: null,
      },
      visible: false,
      backgroundImage: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Section Name</Label>
            <Input
              type="text"
              id="section-name"
              className="h-8 text-xs"
              value={newSection?.name || ''}
              onChange={(e) =>
                setNewSection((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Dimensions</Label>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="width" className="text-xs">Width</Label>
                <Input
                  type="number"
                  id="width"
                  placeholder="Width"
                  className="h-8 text-xs"
                  value={newSection?.dimensions?.width || ''}
                  onChange={(e) =>
                    setNewSection((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev?.dimensions,
                        width: parseInt(e.target.value) || null,
                      },
                    }))
                  }
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="height" className="text-xs">Height</Label>
                <Input
                  type="number"
                  id="height"
                  placeholder="Height"
                  className="h-8 text-xs"
                  value={newSection?.dimensions?.height || ''}
                  onChange={(e) =>
                    setNewSection((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev?.dimensions,
                        height: parseInt(e.target.value) || null,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              <Translate contentKey={"tempApp.table.image"}>Image</Translate>
            </Label>
            <MediaLibrary
              handleFilesSelectCallback={(files) => addImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
              defaultValues={transformAttachmentStructure(newSection?.backgroundImage ? [newSection?.backgroundImage] : [], 'toFileLibraryListItem')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="visible"
              checked={newSection?.visible}
              onCheckedChange={(checked) =>
                setNewSection((prev) => ({
                  ...prev,
                  visible: checked as boolean,
                }))
              }
            />
            <Label htmlFor="visible" className="text-sm cursor-pointer">
              Visible
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAddSection} className="h-8 text-xs">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SectionModal;
