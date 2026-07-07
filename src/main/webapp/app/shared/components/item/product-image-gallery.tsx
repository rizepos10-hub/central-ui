import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Translate } from 'react-jhipster';
import { FileLibraryListItem } from 'react-media-library-cloud-links';
import { IAttachment } from 'app/shared/model/attachment.model';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { Button } from '@/components/ui/button';
import { Maximize2, Trash2 } from 'lucide-react';
import { cn } from 'app/lib/utils';
import ImageLightbox from 'app/shared/components/image-lightbox';

export type ProductImageGalleryProps = {
  attachments: IAttachment[] | null | undefined;
  onAttachmentsChange: (next: IAttachment[]) => void;
  /** Title shown in the card header */
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** When false, render only the gallery body (e.g. inside an accordion). */
  showCard?: boolean;
};

function toFileItems(attachments: IAttachment[] | null | undefined): FileLibraryListItem[] {
  return transformAttachmentStructure(attachments, 'toFileLibraryListItem') as FileLibraryListItem[];
}

function toAttachments(items: FileLibraryListItem[]): IAttachment[] {
  return transformAttachmentStructure(items, 'toIAttachment') as IAttachment[];
}

/**
 * Large main preview + thumbnail strip + add/remove. Uses the same media library / upload flow as before.
 */
export const ProductImageGallery = ({
  attachments,
  onAttachmentsChange,
  title = <Translate contentKey="items.update.image">Images</Translate>,
  description,
  className,
  showCard = true,
}: ProductImageGalleryProps) => {
  const fileItems = useMemo(() => toFileItems(attachments), [attachments]);
  const [mainIndex, setMainIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setMainIndex(i => {
      if (fileItems.length === 0) return 0;
      return Math.min(i, fileItems.length - 1);
    });
  }, [fileItems.length]);

  const handleLibraryChange = useCallback(
    (items: FileLibraryListItem[]) => {
      onAttachmentsChange(toAttachments(items));
    },
    [onAttachmentsChange]
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = fileItems.filter((_, i) => i !== index);
      onAttachmentsChange(toAttachments(next));
      if (index === mainIndex) {
        setMainIndex(Math.max(0, Math.min(mainIndex, next.length - 1)));
      } else if (index < mainIndex) {
        setMainIndex(mainIndex - 1);
      }
    },
    [fileItems, mainIndex, onAttachmentsChange]
  );

  const main = fileItems[mainIndex];
  const hasImages = fileItems.length > 0;

  const body = (
    <div className={cn('space-y-3', !showCard && className)}>
        {!showCard && description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {hasImages ? (
          <>
            <div className="relative rounded-lg border border-border/80 bg-muted/40 aspect-square max-h-[280px] flex items-center justify-center overflow-hidden">
              {main?.thumbnailUrl ? (
                <img
                  src={main.thumbnailUrl}
                  alt={main.title || main.name || main.fileName || 'Product'}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">No preview</span>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-90 shadow-md"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Enlarge image"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-90 shadow-md"
                  onClick={() => removeAt(mainIndex)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {lightboxOpen && main?.thumbnailUrl && (
              <ImageLightbox
                src={main.thumbnailUrl}
                alt={main.title || main.name || main.fileName}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
              />
            )}

            {fileItems.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                {fileItems.map((item, i) => (
                  <button
                    key={`${item._id}-${i}`}
                    type="button"
                    onClick={() => setMainIndex(i)}
                    className={cn(
                      'relative shrink-0 rounded-md border-2 overflow-hidden transition-colors',
                      'h-14 w-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      i === mainIndex ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-border'
                    )}
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 py-8 px-3 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              No images yet. Add from the library or drop files below.
            </p>
          </div>
        )}

        <MediaLibrary
          multiSelect
          layout="compact"
          handleFilesSelectCallback={handleLibraryChange}
          defaultValues={fileItems}
        />
    </div>
  );

  if (!showCard) {
    return body;
  }

  return (
    <div className={cn('border rounded-md p-3 space-y-3', className)}>
      <span className="text-xs font-semibold block">{title}</span>
      {description ? <p className="text-xs text-muted-foreground -mt-2">{description}</p> : null}
      {body}
    </div>
  );
};

export default ProductImageGallery;
