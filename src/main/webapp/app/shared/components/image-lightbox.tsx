import React from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export const ImageLightbox = ({ src, alt, open, onClose }: ImageLightboxProps) => {
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-full p-2 bg-black/90 border-0 flex items-center justify-center"
        style={{ maxHeight: '90vh' }}
      >
        <DialogClose
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-80 hover:opacity-100 transition-opacity"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <img
          src={src}
          alt={alt || ''}
          className="max-h-[85vh] max-w-full object-contain rounded"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
