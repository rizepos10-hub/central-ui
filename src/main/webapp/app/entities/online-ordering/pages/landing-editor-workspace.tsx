import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Eye, EyeOff, Monitor, Redo2, Save, Smartphone, Tablet, Undo2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from 'app/lib/utils';
import { IOnlineOrderingPage, IPageSection } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import PageTemplatePreview from './page-template-preview';
import {
  EditorMode,
  EditorNode,
  LandingEditorEnvelope,
  createEditorDraft,
  createLandingEditorMessage,
  editorPreviewOrigin,
  editorPreviewUrl,
  isLandingEditorEnvelope,
  previewAllowedOrigins,
} from './landing-editor-bridge';

type FrameState = 'loading' | 'ready' | 'error';
type Viewport = 'desktop' | 'tablet' | 'mobile';
type EditorLayout = {
  structure: number;
  canvas: number;
  properties: number;
};

type FrameAnchorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
};

type QuickPropertiesAnchor = Pick<FrameAnchorRect, 'left' | 'top' | 'width' | 'height'>;

const EDITOR_LAYOUT_STORAGE_KEY = 'landing-editor-workspace-layout-v1';
const DEFAULT_EDITOR_LAYOUT: EditorLayout = {
  structure: 16,
  canvas: 68,
  properties: 16,
};

const readEditorLayout = (): EditorLayout => {
  if (typeof window === 'undefined') return DEFAULT_EDITOR_LAYOUT;

  try {
    const stored = window.localStorage.getItem(EDITOR_LAYOUT_STORAGE_KEY);
    if (!stored) return DEFAULT_EDITOR_LAYOUT;

    const parsed = JSON.parse(stored) as Partial<EditorLayout>;
    const values = [parsed.structure, parsed.canvas, parsed.properties];
    if (values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) {
      return DEFAULT_EDITOR_LAYOUT;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return DEFAULT_EDITOR_LAYOUT;

    return {
      structure: (parsed.structure / total) * 100,
      canvas: (parsed.canvas / total) * 100,
      properties: (parsed.properties / total) * 100,
    };
  } catch {
    return DEFAULT_EDITOR_LAYOUT;
  }
};

type LandingEditorWorkspaceProps = {
  page: IOnlineOrderingPage;
  uiSettings: IUiSettings;
  updating: boolean;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedSectionIndex: number | null;
  onSelectSection: (index: number | null) => void;
  onUpdateSection: (index: number, patch: Partial<IPageSection>) => void;
  onSave: () => void;
  onPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onOpenLivePreview: () => void;
  onSetActiveAndPreview: () => void;
  renderPageProperties: () => ReactNode;
  renderChromeProperties: (part: 'header' | 'footer') => ReactNode;
  renderSectionProperties: (index: number) => ReactNode;
  renderAppearanceProperties: (index: number) => ReactNode;
  renderElementProperties: (node: EditorNode) => ReactNode;
};

const sectionLabel = (type?: SectionType) =>
  String(type ?? 'section')
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const viewportWidth: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

const translateFrameAnchor = (frame: HTMLIFrameElement | null, anchorRect?: FrameAnchorRect): QuickPropertiesAnchor | null => {
  if (!frame || !anchorRect) return null;
  const values = [anchorRect.left, anchorRect.top, anchorRect.width, anchorRect.height, anchorRect.viewportWidth, anchorRect.viewportHeight];
  if (values.some(value => !Number.isFinite(value)) || anchorRect.viewportWidth <= 0 || anchorRect.viewportHeight <= 0) return null;

  const frameRect = frame.getBoundingClientRect();
  const scaleX = frameRect.width / anchorRect.viewportWidth;
  const scaleY = frameRect.height / anchorRect.viewportHeight;
  return {
    left: frameRect.left + anchorRect.left * scaleX,
    top: frameRect.top + anchorRect.top * scaleY,
    width: Math.max(anchorRect.width * scaleX, 1),
    height: Math.max(anchorRect.height * scaleY, 1),
  };
};

export default function LandingEditorWorkspace({
  page,
  uiSettings,
  updating,
  dirty,
  canUndo,
  canRedo,
  selectedSectionIndex,
  onSelectSection,
  onUpdateSection,
  onSave,
  onPublish,
  onUndo,
  onRedo,
  onBack,
  onOpenLivePreview,
  onSetActiveAndPreview,
  renderPageProperties,
  renderChromeProperties,
  renderSectionProperties,
  renderAppearanceProperties,
  renderElementProperties,
}: LandingEditorWorkspaceProps) {
  const iframeRefs = useRef<Array<HTMLIFrameElement | null>>([]);
  const hostRevision = useRef(0);
  const lastFrameRevision = useRef(-1);
  const [selectedNode, setSelectedNode] = useState<EditorNode | null>(null);
  const [registry, setRegistry] = useState<EditorNode[]>([]);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [frameState, setFrameState] = useState<FrameState>('loading');
  const [frameError, setFrameError] = useState<string>();
  const [frameKey, setFrameKey] = useState(0);
  const [quickPropertiesOpen, setQuickPropertiesOpen] = useState(false);
  const [quickPropertiesAnchor, setQuickPropertiesAnchor] = useState<QuickPropertiesAnchor | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [editorLayout] = useState<EditorLayout>(() => readEditorLayout());
  const [selectionSource, setSelectionSource] = useState<'canvas' | 'structure'>('structure');

  const handleEditorLayoutChanged = useCallback((layout: Record<string, number>, meta: { isUserInteraction: boolean }) => {
    if (!meta.isUserInteraction || typeof window === 'undefined') return;

    const values = [layout.structure, layout.canvas, layout.properties];
    if (values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) return;

    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return;

    const normalizedLayout: EditorLayout = {
      structure: (layout.structure / total) * 100,
      canvas: (layout.canvas / total) * 100,
      properties: (layout.properties / total) * 100,
    };

    try {
      window.localStorage.setItem(EDITOR_LAYOUT_STORAGE_KEY, JSON.stringify(normalizedLayout));
    } catch {
      // Ignore storage failures (for example, private browsing restrictions).
    }
  }, []);

  const iframeSrc = useMemo(() => editorPreviewUrl(page, uiSettings.domain), [page.id, uiSettings.domain]);
  const frameOrigin = useMemo(() => editorPreviewOrigin(iframeSrc), [iframeSrc]);
  const allowedOrigins = useMemo(() => previewAllowedOrigins(iframeSrc), [iframeSrc]);
  const session = useMemo(() => {
    try {
      const url = new URL(iframeSrc);
      return { sessionId: url.searchParams.get('editorSession') ?? '', nonce: url.searchParams.get('editorNonce') ?? '' };
    } catch {
      return { sessionId: '', nonce: '' };
    }
  }, [iframeSrc]);

  const sendToFrame = useCallback(
    (type: LandingEditorEnvelope['type'], payload: unknown, revision?: number) => {
      const targets = iframeRefs.current.map(frame => frame?.contentWindow).filter((target): target is Window => Boolean(target));
      if (!targets.length || !frameOrigin || !session.sessionId || !session.nonce) return;
      const nextRevision = revision ?? ++hostRevision.current;
      const message = createLandingEditorMessage(session.sessionId, session.nonce, type, payload, nextRevision);
      targets.forEach(target => target.postMessage(message, frameOrigin));
    },
    [frameOrigin, session.nonce, session.sessionId],
  );

  const selectNode = useCallback(
    (node: EditorNode | null, source: 'canvas' | 'structure' = 'structure') => {
      setSelectedNode(node);
      setSelectionSource(source);
      if (source === 'structure') {
        setQuickPropertiesAnchor(null);
        setQuickPropertiesOpen(false);
      }
      if (node?.kind === 'section') {
        const sectionId = node.id.slice('section.'.length);
        let index = (page.sections ?? []).findIndex(section => section.id === sectionId);
        if (index < 0 && node.fieldPath?.startsWith('sections.hero-carousel')) index = (page.sections ?? []).findIndex(section => section.type === SectionType.HERO_CAROUSEL);
        onSelectSection(index >= 0 ? index : null);
      } else if (node?.fieldPath?.startsWith('sections.')) {
        const sectionIndex = Number(node.fieldPath.split('.')[1]);
        onSelectSection(Number.isFinite(sectionIndex) ? sectionIndex : null);
      } else {
        onSelectSection(null);
      }
      if (node) sendToFrame('host-focus', { nodeId: node.id });
    }, [onSelectSection, page.sections, sendToFrame],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const frameWindows = iframeRefs.current.map(frame => frame?.contentWindow).filter(Boolean);
      if (!frameWindows.some(frameWindow => event.source === frameWindow) || !allowedOrigins.includes(event.origin)) return;
      if (!isLandingEditorEnvelope(event.data)) return;
      if (event.data.sessionId !== session.sessionId || event.data.nonce !== session.nonce) return;
      if (event.data.revision !== undefined && event.data.revision < lastFrameRevision.current) return;
      if (event.data.revision !== undefined) lastFrameRevision.current = event.data.revision;

      switch (event.data.type) {
        case 'frame-ready': {
          const payload = event.data.payload as { registry?: EditorNode[] };
          setRegistry(Array.isArray(payload?.registry) ? payload.registry : []);
          setFrameState('ready');
          setFrameError(undefined);
          sendToFrame('host-init', { draft: createEditorDraft(page), mode });
          break;
        }
        case 'frame-select': {
          const payload = event.data.payload as { nodeId?: string; fieldPath?: string; kind?: EditorNode['kind']; label?: string; editor?: EditorNode['editor']; anchorRect?: FrameAnchorRect };
          const node = registry.find(entry => entry.id === payload?.nodeId) ?? (payload?.nodeId ? {
            id: payload.nodeId,
            kind: payload.kind ?? 'component',
            label: payload.label ?? 'Selected element',
            fieldPath: payload.fieldPath,
            editor: payload.editor,
            editable: true,
          } : null);
          const frame = iframeRefs.current.find(candidate => candidate?.contentWindow === event.source) ?? null;
          const isMainSectionElement = Boolean(node?.fieldPath?.startsWith('sections.') && node.kind !== 'section');
          const anchor = isMainSectionElement ? translateFrameAnchor(frame, payload.anchorRect) : null;
          selectNode(node, 'canvas');
          setQuickPropertiesAnchor(anchor);
          setQuickPropertiesOpen(Boolean(anchor));
          break;
        }
        case 'frame-error':
          setFrameState('error');
          setFrameError(String((event.data.payload as { message?: string })?.message ?? 'The storefront preview could not be loaded.'));
          break;
        case 'frame-draft-applied':
          setFrameState('ready');
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [allowedOrigins, mode, page, registry, selectNode, sendToFrame, session.nonce, session.sessionId]);

  useEffect(() => {
    if (frameState === 'ready') return;
    const timer = window.setTimeout(() => {
      setFrameState('error');
      setFrameError('The storefront preview did not answer. Check the preview URL and allowed origins.');
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [frameKey, frameState]);

  useEffect(() => {
    if (frameState !== 'ready') return;
    const timer = window.setTimeout(() => sendToFrame('host-set-draft', { draft: createEditorDraft(page) }), 100);
    return () => window.clearTimeout(timer);
  }, [frameState, page, sendToFrame]);

  const changeMode = (nextMode: EditorMode) => {
    setMode(nextMode);
    sendToFrame('host-set-mode', { mode: nextMode });
  };

  const retryFrame = () => {
    lastFrameRevision.current = -1;
    setFrameState('loading');
    setFrameError(undefined);
    setFrameKey(key => key + 1);
  };

  const saveAndFlush = () => {
    sendToFrame('host-set-draft', { draft: createEditorDraft(page) });
    onSave();
  };

  const publishAndFlush = () => {
    sendToFrame('host-set-draft', { draft: createEditorDraft(page) });
    onPublish();
  };

  const toggleSection = (sectionId: string) => setExpandedSections(previous => ({ ...previous, [sectionId]: !previous[sectionId] }));
  const pageNode: EditorNode = { id: 'page', kind: 'page', label: page.name || 'Landing page', editable: true };
  const activeNode = selectedNode?.id === 'page' ? pageNode : selectedNode;

  const properties = activeNode?.kind === 'section' && selectedSectionIndex != null
    ? selectionSource === 'canvas' ? renderAppearanceProperties(selectedSectionIndex) : renderSectionProperties(selectedSectionIndex)
    : activeNode?.kind === 'chrome'
      ? renderChromeProperties(activeNode.fieldPath?.startsWith('chrome.footer') ? 'footer' : 'header')
      : activeNode?.kind === 'page'
        ? renderPageProperties()
        : activeNode
          ? renderElementProperties(activeNode)
          : (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Select an element to edit.
            </div>
          );

  return (
    <Popover
      open={quickPropertiesOpen}
      onOpenChange={open => {
        setQuickPropertiesOpen(open);
        if (!open) setQuickPropertiesAnchor(null);
      }}
    >
      <div className="flex h-[calc(100dvh-3rem)] min-h-0 w-full flex-col overflow-hidden bg-muted/20 text-foreground">
      <style>{`
        .landing-editor-properties {
          container-type: inline-size;
        }
        .landing-editor-chrome-sections,
        .landing-editor-fields-grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .landing-editor-quick-link {
          grid-template-columns: minmax(0, 1fr);
        }
        .landing-editor-property-groups {
          grid-template-columns: minmax(0, 1fr);
        }
        .landing-editor-property-groups > .group {
          container-type: inline-size;
        }
        @media (min-width: 40rem) {
          .landing-editor-properties-popover .landing-editor-property-groups {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .landing-editor-properties .property-editor-group-description {
          display: none;
        }
        .landing-editor-properties .property-editor-group-content {
          padding: 0.5rem;
        }
        .landing-editor-properties-popover .landing-editor-chrome-fields {
          border: 0;
          box-shadow: none;
        }
        .landing-editor-properties-popover .property-editor-group > summary {
          gap: 0.375rem;
          padding: 0.375rem 0.5rem;
        }
        .landing-editor-properties-popover .property-editor-group > summary > span:first-child {
          height: 1.25rem;
          width: 1.25rem;
        }
        .landing-editor-properties-popover .property-editor-group-content {
          padding: 0.375rem;
        }
        .landing-editor-properties-popover .landing-editor-chrome-sections,
        .landing-editor-properties-popover .landing-editor-property-groups {
          gap: 0.375rem;
        }
        .landing-editor-properties-popover .landing-editor-chrome-sections > section {
          padding: 0.5rem;
        }
        .landing-editor-wide-field {
          grid-column: 1 / -1;
        }
        .landing-editor-config-fields input:not([type="file"]),
        .landing-editor-config-fields textarea,
        .landing-editor-chrome-fields input:not([type="file"]) {
          font-size: 0.75rem;
        }
        .landing-editor-config-fields input:not([type="file"]),
        .landing-editor-config-fields textarea,
        .landing-editor-chrome-fields input:not([type="file"]) {
          height: 2rem;
        }
        @container (min-width: 24rem) {
          .landing-editor-property-groups {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @container (min-width: 30rem) {
          .landing-editor-chrome-sections,
          .landing-editor-fields-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .landing-editor-quick-link {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
            align-items: center;
          }
        }
      `}</style>
      <header className="z-30 flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b bg-background px-3 py-1.5 shadow-sm lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Back to landing pages"><X className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{page.name || 'Landing page'}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{page.templateKey || 'Fixed template'}</span>
              <span className={cn('rounded-full px-1.5 py-0.5', dirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{dirty ? 'Unsaved changes' : 'Saved'}</span>
            </div>
          </div>
          <div className="hidden items-center gap-1 border-l pl-3 text-xs text-muted-foreground sm:flex">
            <span className="mr-1">Canvas</span>
            {(['desktop', 'tablet', 'mobile'] as Viewport[]).map(option => (
              <Button key={option} variant={viewport === option ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewport(option)} aria-label={`${option} viewport`}>
                {option === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : option === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground lg:flex">
            <span className={cn('h-2 w-2 rounded-full', frameState === 'ready' ? 'bg-emerald-500' : frameState === 'error' ? 'bg-red-500' : 'bg-amber-500')} />
            {frameState === 'ready' ? 'Live storefront preview' : frameState === 'error' ? 'Preview unavailable' : 'Connecting to storefront…'}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canUndo} onClick={onUndo} aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canRedo} onClick={onRedo} aria-label="Redo"><Redo2 className="h-4 w-4" /></Button>
          <div className="hidden items-center rounded-md border bg-muted/40 p-0.5 md:flex">
            <Button variant={mode === 'edit' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => changeMode('edit')}>Edit</Button>
            <Button variant={mode === 'preview' ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => changeMode('preview')}><Eye className="mr-1 h-3 w-3" />Preview</Button>
          </div>
          <Button variant="outline" className="hidden h-8 text-xs xl:inline-flex" onClick={onOpenLivePreview}><ExternalLink className="mr-1 h-3 w-3" />Open storefront</Button>
          <Button variant="outline" className="h-8 text-xs" disabled={updating || !page.id} onClick={saveAndFlush}><Save className="mr-1 h-3 w-3" />Save</Button>
          <Button className="h-8 text-xs" disabled={updating || !page.id} onClick={publishAndFlush}>Publish</Button>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" defaultLayout={editorLayout} onLayoutChanged={handleEditorLayoutChanged} resizeTargetMinimumSize={{ coarse: 28, fine: 14 }} className="hidden min-h-0 min-w-0 flex-1 lg:flex" id="landing-editor-workspace">
        <ResizablePanel id="structure" defaultSize="16%" minSize="8%" maxSize="30%" className="min-w-0 overflow-hidden bg-background">
          <aside className="flex h-full min-h-0 flex-col">
            <div className="border-b px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Structure</p><p className="mt-1 text-[11px] text-muted-foreground">Fixed template slots</p></div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
              <button type="button" className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted', activeNode?.id === 'page' && 'bg-primary/10 text-primary')} onClick={() => selectNode(pageNode, 'structure')}>
                <span className="h-2 w-2 rounded-full bg-primary" /><span className="min-w-0 flex-1 truncate">{page.name || 'Landing page'}</span>
              </button>
              {(['header', 'footer'] as const).map(part => {
                const node: EditorNode = { id: `chrome.${part}`, kind: 'chrome', label: part === 'header' ? 'Navbar' : 'Footer', fieldPath: `chrome.${part}`, editable: true };
                return <button type="button" key={part} className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted', activeNode?.id === node.id && 'bg-primary/10 text-primary')} onClick={() => selectNode(node, 'structure')}><span className="h-2 w-2 rounded-full bg-slate-400" /><span>{node.label}</span><span className="ml-auto text-[10px] text-muted-foreground">Edit</span></button>;
              })}
              <div className="my-2 border-t" />
              {(page.sections ?? []).map((section, index) => {
                const sectionId = section.id || `slot-${index + 1}`;
                const expanded = expandedSections[sectionId] ?? index === selectedSectionIndex;
                const node: EditorNode = { id: `section.${sectionId}`, kind: 'section', label: sectionLabel(section.type), fieldPath: `sections.${index}.config`, editable: true, locked: true };
                const sectionElements = registry.filter(entry => entry.kind !== 'page' && entry.kind !== 'chrome' && entry.kind !== 'section' && entry.fieldPath?.startsWith(`sections.${index}.`));
                return <div key={sectionId} className={cn('rounded-md border', activeNode?.id === node.id && 'border-primary/50 bg-primary/[0.03]')}>
                  <div className="flex items-center gap-1">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left" onClick={() => { selectNode(node, 'structure'); toggleSection(sectionId); }}>
                      {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{sectionLabel(section.type)}</span>
                      {section.visible === false ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-emerald-600" />}
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="mr-1 h-7 w-7" aria-label={`Toggle ${sectionLabel(section.type)} visibility`} onClick={() => onUpdateSection(index, { visible: section.visible === false })}>{section.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                  </div>
                  {expanded && <div className="border-t px-2 pb-2 pt-1">
                    <div className="px-5 py-1 text-[10px] text-muted-foreground">Slot {index + 1} · Layout locked</div>
                    {sectionElements.length > 0 && <div className="space-y-0.5">
                      {sectionElements.map(element => <button type="button" key={element.id} className={cn('flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[11px] hover:bg-muted', activeNode?.id === element.id && 'bg-primary/10 text-primary')} onClick={() => selectNode(element, 'structure')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', element.kind === 'media' ? 'bg-amber-500' : element.kind === 'action' ? 'bg-emerald-500' : 'bg-sky-500')} /><span className="min-w-0 flex-1 truncate">{element.label}</span>
                      </button>)}
                    </div>}
                  </div>}
                </div>;
              })}
            </div>
            <div className="border-t p-3"><Button variant="outline" className="h-8 w-full text-xs" onClick={onSetActiveAndPreview}>Set as active landing page</Button></div>
          </aside>
        </ResizablePanel>
        <ResizableHandle id="structure-resize" aria-label="Resize structure panel" withHandle />
        <ResizablePanel id="canvas" defaultSize="68%" minSize="30%" className="min-w-0 overflow-hidden">
          <main className="flex h-full min-h-0 min-w-0 items-start justify-center overflow-hidden bg-slate-100 p-3 sm:p-5">
            {frameState === 'error' ? (
              <div className="flex max-w-md flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-xl border bg-background p-3 shadow-sm"><PageTemplatePreview page={page} isActive={false} storeDomain={uiSettings.domain} showLinks={false} /></div>
                <div><p className="text-sm font-semibold">Preview needs attention</p><p className="mt-1 text-xs text-muted-foreground">{frameError || 'The storefront frame was blocked or timed out.'}</p></div>
                <div className="flex gap-2"><Button size="sm" onClick={retryFrame}>Retry preview</Button><Button size="sm" variant="outline" onClick={onOpenLivePreview}>Open storefront</Button></div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 w-full transition-[max-width]" style={{ maxWidth: viewportWidth[viewport] }}>
                <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-white shadow-lg">
                  <iframe key={`desktop-${frameKey}`} ref={element => { iframeRefs.current[0] = element; }} title="Landing page storefront preview" src={iframeSrc} className="block h-full min-h-0 w-full flex-1 bg-white" onLoad={() => setFrameState(previous => previous === 'error' ? previous : 'loading')} />
                </div>
              </div>
            )}
          </main>
        </ResizablePanel>
        <ResizableHandle id="properties-resize" aria-label="Resize properties panel" withHandle />
        <ResizablePanel id="properties" defaultSize="16%" minSize="8%" maxSize="30%" className="min-w-0 overflow-hidden bg-background">
          <aside className="landing-editor-properties flex h-full min-h-0 min-w-0 flex-col">
            <div className="border-b px-3 py-2"><p className="truncate text-xs font-semibold text-foreground">{activeNode?.label || 'Properties'}</p></div>
            <div className="landing-editor-properties-content min-h-0 min-w-0 flex-1 w-full overflow-x-hidden overflow-y-auto overscroll-contain p-2">
              {properties}
              {activeNode?.kind === 'section' && selectedSectionIndex != null && selectionSource === 'structure' && <div className="mt-2 border-t pt-2">{renderAppearanceProperties(selectedSectionIndex)}</div>}
            </div>
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100 p-3">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white shadow-lg"><iframe key={`mobile-${frameKey}`} ref={element => { iframeRefs.current[1] = element; }} title="Landing page storefront preview" src={iframeSrc} className="block h-full min-h-0 w-full flex-1" /></div>
          {frameState === 'error' && <div className="absolute inset-x-6 bottom-6 rounded-lg border bg-background p-3 text-center text-xs shadow-md" role="alert"><p>{frameError}</p><Button size="sm" className="mt-2" onClick={retryFrame}>Retry</Button></div>}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t bg-background p-2">
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 text-xs" disabled={!activeNode || !quickPropertiesAnchor}>Edit</Button>
          </PopoverTrigger>
          <Button className="flex-1 text-xs" disabled={updating || !page.id} onClick={saveAndFlush}>Save changes</Button>
        </div>
      </div>

      </div>

      {quickPropertiesAnchor && (
        <PopoverAnchor
          aria-hidden="true"
          className="pointer-events-none fixed h-px w-px opacity-0"
          style={{
            left: quickPropertiesAnchor.left,
            top: quickPropertiesAnchor.top,
            width: quickPropertiesAnchor.width,
            height: quickPropertiesAnchor.height,
          }}
        />
      )}
      <PopoverContent
        side={quickPropertiesAnchor ? 'right' : 'top'}
        align="start"
        sideOffset={12}
        className="landing-editor-properties-popover max-h-[min(70vh,34rem)] w-[min(92vw,26rem)] max-w-[calc(100vw-1rem)] overflow-y-auto p-2 duration-150 ease-out sm:p-2.5"
      >
        <div className="landing-editor-properties w-full min-w-0">
          <div className="mb-2 truncate text-xs font-semibold text-foreground">{activeNode?.label || 'Quick edit'}</div>
          {properties}
          {activeNode?.kind === 'section' && selectedSectionIndex != null && selectionSource === 'structure' && (
            <div className="mt-2 border-t pt-2">{renderAppearanceProperties(selectedSectionIndex)}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
