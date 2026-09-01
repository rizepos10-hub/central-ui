import React, { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from 'app/lib/utils';

type PropertyEditorGroupProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export const PropertyEditorGroup = ({
  title,
  description,
  children,
  defaultOpen = true,
  badge,
  className,
  contentClassName,
}: PropertyEditorGroupProps) => (
  <PropertyEditorGroupContent
    title={title}
    description={description}
    defaultOpen={defaultOpen}
    badge={badge}
    className={className}
    contentClassName={contentClassName}
  >
    {children}
  </PropertyEditorGroupContent>
);

const PropertyEditorGroupContent = ({
  title,
  description,
  children,
  defaultOpen,
  badge,
  className,
  contentClassName,
}: PropertyEditorGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
  <details className={cn('property-editor-group group rounded-lg border bg-background/80 shadow-sm', className)} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 [&::-webkit-details-marker]:hidden">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-foreground">{title}</span>
        {description && <span className="property-editor-group-description mt-0.5 block truncate text-[10px] text-muted-foreground">{description}</span>}
      </span>
      {badge && <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">{badge}</span>}
    </summary>
    <div className={cn('property-editor-group-content border-t px-2.5 py-2.5', contentClassName)}>{children}</div>
  </details>
  );
};
