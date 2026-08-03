import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type FooterBlockType = 'LOGO' | 'QUICK_LINKS' | 'FREE_TEXT' | 'CONTACT' | 'WORKING_HOURS' | 'SOCIAL';

export type FooterLink = { label: string; url: string };

export type FooterBlock = {
  id: string;
  type: FooterBlockType;
  title?: string;
  showContactUnderLogo?: boolean;
  links?: FooterLink[];
  body?: string;
  address?: string;
  phone?: string;
  email?: string;
  hoursText?: string;
};

export type FooterColumn = {
  id: string;
  title?: string;
  blocks: FooterBlock[];
};

const BLOCK_LABELS: Record<FooterBlockType, string> = {
  LOGO: 'Logo',
  QUICK_LINKS: 'Quick links',
  FREE_TEXT: 'Free text',
  CONTACT: 'Contact',
  WORKING_HOURS: 'Working hours',
  SOCIAL: 'Social profiles',
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const defaultFooterColumns = (): FooterColumn[] => [
  {
    id: newId(),
    blocks: [{ id: newId(), type: 'LOGO', showContactUnderLogo: true }],
  },
  {
    id: newId(),
    blocks: [{ id: newId(), type: 'WORKING_HOURS', title: 'Working Hours' }],
  },
  {
    id: newId(),
    blocks: [{ id: newId(), type: 'SOCIAL', title: 'Follow Us' }],
  },
  {
    id: newId(),
    blocks: [
      {
        id: newId(),
        type: 'QUICK_LINKS',
        title: 'Quick Links',
        links: [
          { label: 'Privacy Policy', url: '/privacy-policy' },
          { label: 'Return Policy', url: '/return-policy' },
          { label: 'About Us', url: '/about-us' },
        ],
      },
    ],
  },
];

const defaultBlockFor = (type: FooterBlockType): FooterBlock => {
  const id = newId();
  switch (type) {
    case 'LOGO':
      return { id, type, showContactUnderLogo: true };
    case 'QUICK_LINKS':
      return { id, type, title: 'Quick Links', links: [{ label: '', url: '' }] };
    case 'FREE_TEXT':
      return { id, type, title: '', body: '' };
    case 'CONTACT':
      return { id, type, title: 'Contact' };
    case 'WORKING_HOURS':
      return { id, type, title: 'Working Hours' };
    case 'SOCIAL':
      return { id, type, title: 'Follow Us' };
    default:
      return { id, type: 'FREE_TEXT', body: '' };
  }
};

type FooterSectionEditorProps = {
  columns: FooterColumn[];
  showCopyright: boolean;
  copyrightText: string;
  onColumnsChange: (columns: FooterColumn[]) => void;
  onShowCopyrightChange: (value: boolean) => void;
  onCopyrightTextChange: (value: string) => void;
};

export const FooterSectionEditor = ({
  columns,
  showCopyright,
  copyrightText,
  onColumnsChange,
  onShowCopyrightChange,
  onCopyrightTextChange,
}: FooterSectionEditorProps) => {
  const updateColumn = (colIndex: number, patch: Partial<FooterColumn>) => {
    const next = [...columns];
    next[colIndex] = { ...next[colIndex], ...patch };
    onColumnsChange(next);
  };

  const updateBlock = (colIndex: number, blockIndex: number, patch: Partial<FooterBlock>) => {
    const next = [...columns];
    const blocks = [...(next[colIndex].blocks ?? [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...patch };
    next[colIndex] = { ...next[colIndex], blocks };
    onColumnsChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={showCopyright} onCheckedChange={checked => onShowCopyrightChange(checked === true)} />
        <Label>Show copyright bar</Label>
      </div>
      {showCopyright && (
        <>
          <Label>Copyright text (optional)</Label>
          <Input
            value={copyrightText}
            placeholder="All rights reserved"
            onChange={e => onCopyrightTextChange(e.target.value)}
          />
        </>
      )}

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Columns ({columns.length})</Label>
        <Button
          type="button"
          variant="outline"
          className="h-8 text-xs"
          onClick={() =>
            onColumnsChange([
              ...columns,
              { id: newId(), title: '', blocks: [defaultBlockFor('FREE_TEXT')] },
            ])
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          Add column
        </Button>
      </div>

      {columns.map((column, colIndex) => (
        <div key={column.id} className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Column {colIndex + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onColumnsChange(columns.filter((_, i) => i !== colIndex))}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Label>Column title (optional)</Label>
          <Input
            value={column.title ?? ''}
            onChange={e => updateColumn(colIndex, { title: e.target.value })}
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <Label className="text-xs">Blocks ({column.blocks?.length ?? 0})</Label>
            <Select
              onValueChange={(type: FooterBlockType) => {
                const blocks = [...(column.blocks ?? []), defaultBlockFor(type)];
                updateColumn(colIndex, { blocks });
              }}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Add block" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BLOCK_LABELS) as FooterBlockType[]).map(type => (
                  <SelectItem key={type} value={type}>
                    {BLOCK_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(column.blocks ?? []).map((block, blockIndex) => (
            <div key={block.id} className="space-y-2 rounded border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{BLOCK_LABELS[block.type] ?? block.type}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    const blocks = (column.blocks ?? []).filter((_, i) => i !== blockIndex);
                    updateColumn(colIndex, { blocks });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {block.type !== 'LOGO' && (
                <>
                  <Label>Title</Label>
                  <Input
                    value={block.title ?? ''}
                    onChange={e => updateBlock(colIndex, blockIndex, { title: e.target.value })}
                  />
                </>
              )}

              {block.type === 'LOGO' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={block.showContactUnderLogo === true}
                    onCheckedChange={checked =>
                      updateBlock(colIndex, blockIndex, { showContactUnderLogo: checked === true })
                    }
                  />
                  <Label>Show contact under logo</Label>
                </div>
              )}

              {block.type === 'FREE_TEXT' && (
                <>
                  <Label>Text</Label>
                  <Input
                    value={block.body ?? ''}
                    onChange={e => updateBlock(colIndex, blockIndex, { body: e.target.value })}
                  />
                </>
              )}

              {block.type === 'WORKING_HOURS' && (
                <>
                  <Label>Hours override (optional)</Label>
                  <Input
                    value={block.hoursText ?? ''}
                    placeholder="Uses storefront working hours if empty"
                    onChange={e => updateBlock(colIndex, blockIndex, { hoursText: e.target.value })}
                  />
                </>
              )}

              {block.type === 'CONTACT' && (
                <>
                  <Label>Address override</Label>
                  <Input
                    value={block.address ?? ''}
                    onChange={e => updateBlock(colIndex, blockIndex, { address: e.target.value })}
                  />
                  <Label>Phone override</Label>
                  <Input
                    value={block.phone ?? ''}
                    onChange={e => updateBlock(colIndex, blockIndex, { phone: e.target.value })}
                  />
                  <Label>Email override</Label>
                  <Input
                    value={block.email ?? ''}
                    onChange={e => updateBlock(colIndex, blockIndex, { email: e.target.value })}
                  />
                </>
              )}

              {block.type === 'QUICK_LINKS' && (
                <div className="space-y-2">
                  <Label className="text-xs">Links</Label>
                  {(block.links ?? []).map((link, linkIndex) => (
                    <div key={linkIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={e => {
                          const links = [...(block.links ?? [])];
                          links[linkIndex] = { ...links[linkIndex], label: e.target.value };
                          updateBlock(colIndex, blockIndex, { links });
                        }}
                      />
                      <Input
                        placeholder="/path or URL"
                        value={link.url}
                        onChange={e => {
                          const links = [...(block.links ?? [])];
                          links[linkIndex] = { ...links[linkIndex], url: e.target.value };
                          updateBlock(colIndex, blockIndex, { links });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const links = (block.links ?? []).filter((_, i) => i !== linkIndex);
                          updateBlock(colIndex, blockIndex, { links });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      updateBlock(colIndex, blockIndex, {
                        links: [...(block.links ?? []), { label: '', url: '' }],
                      })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add link
                  </Button>
                </div>
              )}

              {block.type === 'SOCIAL' && (
                <p className="text-xs text-muted-foreground">Uses social URLs from storefront settings.</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
