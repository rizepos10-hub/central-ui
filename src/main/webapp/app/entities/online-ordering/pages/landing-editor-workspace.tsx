import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Eye, EyeOff, Monitor, Redo2, Save, Smartphone, Tablet, Undo2, X } from 'lucide-react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  renderChromeProperties: () => ReactNode;
  renderSectionProperties: (index: number) => ReactNode;
  renderAppearanceProperties: (index: number) => ReactNode;
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

function isChromeNode(node?: EditorNode | null): boolean {
  return Boolean(node?.id.startsWith('chrome.'));
}

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
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
    (node: EditorNode | null) => {
      setSelectedNode(node);
      if (node?.id.startsWith('section.')) {
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
          const payload = event.data.payload as { nodeId?: string };
          const node = registry.find(entry => entry.id === payload?.nodeId) ?? (payload?.nodeId ? { id: payload.nodeId, kind: 'component', label: 'Selected element', editable: true } : null);
          selectNode(node);
          setMobilePropertiesOpen(true);
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

  const properties = activeNode && activeNode.kind === 'section' && selectedSectionIndex != null
    ? renderSectionProperties(selectedSectionIndex)
    : isChromeNode(activeNode)
      ? renderChromeProperties()
      : activeNode?.id === 'page'
        ? renderPageProperties()
        : (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
              <p className="font-medium text-foreground">Select something to edit</p>
              <p className="mt-1 text-xs">Click a section, header, footer, logo, or carousel image in the preview.</p>
            </div>
            {selectedSectionIndex != null && renderSectionProperties(selectedSectionIndex)}
          </div>
        );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-muted/20 text-foreground">
      <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2 shadow-sm lg:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Back to landing pages"><X className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{page.name || 'Landing page'}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{page.templateKey || 'Fixed template'}</span>
              <span className={cn('rounded-full px-1.5 py-0.5', dirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>{dirty ? 'Unsaved changes' : 'Saved'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
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

      <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2 lg:px-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground"><span className="mr-1 hidden sm:inline">Canvas</span>
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map(option => (
            <Button key={option} variant={viewport === option ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewport(option)} aria-label={`${option} viewport`}>
              {option === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : option === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', frameState === 'ready' ? 'bg-emerald-500' : frameState === 'error' ? 'bg-red-500' : 'bg-amber-500')} />
          {frameState === 'ready' ? 'Live storefront preview' : frameState === 'error' ? 'Preview unavailable' : 'Connecting to storefront…'}
        </div>
      </div>

      <Group orientation="horizontal" defaultLayout={{ structure: 19, canvas: 56, properties: 25 }} resizeTargetMinimumSize={{ coarse: 28, fine: 14 }} className="hidden min-h-0 flex-1 lg:flex" id="landing-editor-workspace">
        <Panel id="structure" defaultSize={19} minSize={15} maxSize={28} className="min-w-0 overflow-hidden bg-background">
          <aside className="flex h-full flex-col">
            <div className="border-b px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Structure</p><p className="mt-1 text-[11px] text-muted-foreground">Fixed template slots</p></div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              <button type="button" className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted', activeNode?.id === 'page' && 'bg-primary/10 text-primary')} onClick={() => selectNode(pageNode)}>
                <span className="h-2 w-2 rounded-full bg-primary" /><span className="min-w-0 flex-1 truncate">{page.name || 'Landing page'}</span>
              </button>
              {(['header', 'footer'] as const).map(part => {
                const node: EditorNode = { id: `chrome.${part}`, kind: 'chrome', label: part === 'header' ? 'Header & navigation' : 'Footer', fieldPath: `chrome.${part}`, editable: true };
                return <button type="button" key={part} className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted', activeNode?.id === node.id && 'bg-primary/10 text-primary')} onClick={() => selectNode(node)}><span className="h-2 w-2 rounded-full bg-slate-400" /><span>{node.label}</span><span className="ml-auto text-[10px] text-muted-foreground">Edit</span></button>;
              })}
              <div className="my-2 border-t" />
              {(page.sections ?? []).map((section, index) => {
                const sectionId = section.id || `slot-${index + 1}`;
                const expanded = expandedSections[sectionId] ?? index === selectedSectionIndex;
                const node: EditorNode = { id: `section.${sectionId}`, kind: 'section', label: sectionLabel(section.type), fieldPath: `sections.${index}.config`, editable: true, locked: true };
                return <div key={sectionId} className={cn('rounded-md border', activeNode?.id === node.id && 'border-primary/50 bg-primary/[0.03]')}>
                  <div className="flex items-center gap-1">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left" onClick={() => { selectNode(node); toggleSection(sectionId); }}>
                      {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{sectionLabel(section.type)}</span>
                      {section.visible === false ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-emerald-600" />}
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="mr-1 h-7 w-7" aria-label={`Toggle ${sectionLabel(section.type)} visibility`} onClick={() => onUpdateSection(index, { visible: section.visible === false })}>{section.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                  </div>
                  {expanded && <div className="border-t px-7 pb-2 pt-1 text-[10px] text-muted-foreground">Slot {index + 1} · Layout locked</div>}
                </div>;
              })}
            </div>
            <div className="border-t p-3"><Button variant="outline" className="h-8 w-full text-xs" onClick={onSetActiveAndPreview}>Set as active landing page</Button></div>
          </aside>
        </Panel>
        <Separator id="structure-resize" aria-label="Resize structure panel" className="z-20 h-full w-2 cursor-col-resize bg-border transition-colors hover:bg-primary/50 focus-visible:bg-primary/60" />
        <Panel id="canvas" defaultSize={56} minSize={38} className="min-w-0 overflow-hidden">
          <main className="flex h-full min-h-0 items-start justify-center overflow-auto bg-slate-100 p-3 sm:p-5">
            {frameState === 'error' ? (
              <div className="flex max-w-md flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-xl border bg-background p-3 shadow-sm"><PageTemplatePreview page={page} isActive={false} storeDomain={uiSettings.domain} showLinks={false} /></div>
                <div><p className="text-sm font-semibold">Preview needs attention</p><p className="mt-1 text-xs text-muted-foreground">{frameError || 'The storefront frame was blocked or timed out.'}</p></div>
                <div className="flex gap-2"><Button size="sm" onClick={retryFrame}>Retry preview</Button><Button size="sm" variant="outline" onClick={onOpenLivePreview}>Open storefront</Button></div>
              </div>
            ) : (
              <div className="w-full transition-[max-width]" style={{ maxWidth: viewportWidth[viewport] }}>
                <div className="overflow-hidden rounded-xl border bg-white shadow-lg">
                  <iframe key={`desktop-${frameKey}`} ref={element => { iframeRefs.current[0] = element; }} title="Landing page storefront preview" src={iframeSrc} className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-white" onLoad={() => setFrameState(previous => previous === 'error' ? previous : 'loading')} />
                </div>
              </div>
            )}
          </main>
        </Panel>
        <Separator id="properties-resize" aria-label="Resize properties panel" className="z-20 h-full w-2 cursor-col-resize bg-border transition-colors hover:bg-primary/50 focus-visible:bg-primary/60" />
        <Panel id="properties" defaultSize={25} minSize={20} maxSize={34} className="min-w-0 overflow-hidden bg-background">
          <aside className="flex h-full flex-col">
            <div className="border-b px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Properties</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{activeNode?.label || 'Nothing selected'}</p></div>
            <div className="flex-1 overflow-y-auto p-4">{properties}</div>
            {selectedSectionIndex != null && <div className="border-t p-3">{renderAppearanceProperties(selectedSectionIndex)}</div>}
          </aside>
        </Panel>
      </Group>

      <div className="flex flex-1 flex-col lg:hidden">
        <div className="flex-1 overflow-auto bg-slate-100 p-3">
          <div className="overflow-hidden rounded-xl border bg-white shadow-lg"><iframe key={`mobile-${frameKey}`} ref={element => { iframeRefs.current[1] = element; }} title="Landing page storefront preview" src={iframeSrc} className="block h-[calc(100vh-12rem)] min-h-[620px] w-full" /></div>
          {frameState === 'error' && <div className="mt-3 rounded-lg border bg-background p-3 text-center text-xs"><p>{frameError}</p><Button size="sm" className="mt-2" onClick={retryFrame}>Retry</Button></div>}
        </div>
        <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background p-2"><Button variant="outline" className="flex-1 text-xs" onClick={() => setMobilePropertiesOpen(true)}>Edit selected</Button><Button className="flex-1 text-xs" disabled={updating || !page.id} onClick={saveAndFlush}>Save changes</Button></div>
      </div>

      <Sheet open={mobilePropertiesOpen} onOpenChange={setMobilePropertiesOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="text-left"><SheetTitle className="text-base">{activeNode?.label || 'Landing page properties'}</SheetTitle><SheetDescription className="text-xs">Changes update the live preview immediately.</SheetDescription></SheetHeader>
          <div className="mt-4">{properties}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
