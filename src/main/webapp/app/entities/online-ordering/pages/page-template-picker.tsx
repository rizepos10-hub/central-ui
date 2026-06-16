import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { createFromTemplate, getTemplates } from './page-template.actions';
import { getEntities } from './pages.reducer';
import { IPageTemplateDescriptor } from 'app/shared/model/ONLINE_ORDERING/page-template.model';

type PageTemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const verticalLabel = (vertical: string) => {
  switch (vertical) {
    case 'restaurant':
      return 'Restaurant';
    case 'retail':
      return 'Retail';
    default:
      return 'General';
  }
};

export const PageTemplatePicker = ({ open, onOpenChange }: PageTemplatePickerProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const templates = useAppSelector(state => state.onlineOrderingPage.templates);
  const updating = useAppSelector(state => state.onlineOrderingPage.updating);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(getTemplates());
      setSelectedKey(null);
    }
  }, [dispatch, open]);

  const handleCreate = async (publish: boolean) => {
    if (!selectedKey) {
      toast.warn('Choose a template first');
      return;
    }
    try {
      const result = await dispatch(createFromTemplate({ templateKey: selectedKey, publish })).unwrap();
      await dispatch(getEntities());
      toast.success(publish ? 'Page created and published' : 'Page created as draft');
      onOpenChange(false);
      navigate(`/online-ordering/pages/${result.data.id}/edit`);
    } catch {
      toast.error('Failed to create page from template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start from template</DialogTitle>
          <DialogDescription>
            Pick a starter layout. You can customize sections, colors, and content after creating the page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template: IPageTemplateDescriptor) => {
            const selected = selectedKey === template.key;
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => setSelectedKey(template.key)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">/{template.defaultSlug}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {verticalLabel(template.vertical)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{template.description}</p>
              </button>
            );
          })}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No templates available.</CardContent>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="h-8 text-xs"
            disabled={!selectedKey || updating}
            onClick={() => handleCreate(false)}
          >
            Create draft
          </Button>
          <Button className="h-8 text-xs" disabled={!selectedKey || updating} onClick={() => handleCreate(true)}>
            Create & publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageTemplatePicker;
