import { IOnlineOrderingPage, IPageSection } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { SectionType } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { runtimeConfig } from 'app/config/runtime-config';
import { LOCAL_STOREFRONT_URL } from './page-preview-utils';

export const LANDING_EDITOR_CHANNEL = 'cloudlinks.landing-editor' as const;
export const LANDING_EDITOR_VERSION = 1 as const;

export type LandingEditorMessageType =
  | 'frame-ready'
  | 'frame-select'
  | 'frame-error'
  | 'frame-draft-applied'
  | 'host-init'
  | 'host-set-draft'
  | 'host-set-mode'
  | 'host-focus';

export type LandingEditorEnvelope = {
  channel: typeof LANDING_EDITOR_CHANNEL;
  version: typeof LANDING_EDITOR_VERSION;
  sessionId: string;
  nonce: string;
  revision?: number;
  type: LandingEditorMessageType;
  payload: unknown;
};

export type EditorMode = 'edit' | 'preview';

export type EditorNodeEditor = {
  /** Dot path for the shared style object used by the storefront renderer. */
  stylePath?: string;
  /** Optional dot path for an existing visibility flag. */
  visibilityPath?: string;
  /** Optional dot path for image alt text. */
  altPath?: string;
  /** Optional dot path for editable text content. */
  textPath?: string;
  /** Optional dot path for an action URL. */
  urlPath?: string;
  /** Optional dot path for an action variant. */
  variantPath?: string;
  /** Optional dedicated width/height paths for media. */
  widthPath?: string;
  heightPath?: string;
};

export type EditorNode = {
  id: string;
  parentId?: string;
  kind: 'page' | 'chrome' | 'section' | 'component' | 'media' | 'text' | 'action';
  label: string;
  fieldPath?: string;
  editable: boolean;
  locked?: boolean;
  editor?: EditorNodeEditor;
  children?: EditorNode[];
};

export type EditorDraftSnapshot = {
  pageId?: string;
  name?: string;
  slug?: string;
  templateKey?: string;
  templateVersion?: number;
  themeOverride?: IOnlineOrderingPage['themeOverride'];
  seo?: IOnlineOrderingPage['seo'];
  chrome?: IOnlineOrderingPage['chrome'];
  sections: Array<Pick<IPageSection, 'id' | 'type' | 'order' | 'visible' | 'config'>>;
};

export function stableLandingSlotId(index: number, type: SectionType): string {
  return `slot-${index + 1}-${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function normalizeLandingPage(page: IOnlineOrderingPage): IOnlineOrderingPage {
  return {
    ...page,
    sections: (page.sections ?? []).map((section, index) => ({
      ...section,
      id: section.id?.trim() || stableLandingSlotId(index, section.type),
      order: index,
      visible: section.visible !== false,
      config: { ...(section.config ?? {}) },
    })),
  };
}

export function createEditorDraft(page: IOnlineOrderingPage): EditorDraftSnapshot {
  const normalized = normalizeLandingPage(page);
  return {
    pageId: normalized.id,
    name: normalized.name,
    slug: normalized.slug,
    templateKey: normalized.templateKey,
    templateVersion: normalized.templateVersion,
    themeOverride: normalized.themeOverride,
    seo: normalized.seo,
    chrome: normalized.chrome,
    sections: (normalized.sections ?? []).map(section => ({
      id: section.id,
      type: section.type,
      order: section.order,
      visible: section.visible !== false,
      config: { ...(section.config ?? {}) },
    })),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

export function isLandingEditorEnvelope(value: unknown): value is LandingEditorEnvelope {
  if (!isObject(value)) return false;
  return (
    value.channel === LANDING_EDITOR_CHANNEL &&
    value.version === LANDING_EDITOR_VERSION &&
    typeof value.sessionId === 'string' &&
    typeof value.nonce === 'string' &&
    typeof value.type === 'string' &&
    (value.revision === undefined || typeof value.revision === 'number')
  );
}

export function createLandingEditorMessage(
  sessionId: string,
  nonce: string,
  type: LandingEditorMessageType,
  payload: unknown,
  revision?: number,
): LandingEditorEnvelope {
  return {
    channel: LANDING_EDITOR_CHANNEL,
    version: LANDING_EDITOR_VERSION,
    sessionId,
    nonce,
    ...(revision === undefined ? {} : { revision }),
    type,
    payload,
  };
}

export function editorPreviewOrigin(url: string): string | null {
  try {
    return new URL(url, window.location.origin).origin;
  } catch {
    return null;
  }
}

export function editorPreviewUrl(page: IOnlineOrderingPage, storefrontDomain?: string): string {
  const configured = runtimeConfig.ONLINE_ORDERING_EDITOR_URL?.trim();
  const isLocalDevelopment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const base = (configured || (isLocalDevelopment ? LOCAL_STOREFRONT_URL : storefrontDomain) || LOCAL_STOREFRONT_URL).replace(/\/$/, '');
  const path = base.includes('/preview/pages/') ? base.replace(/\/preview\/pages\/[^/]+$/, `/preview/pages/${page.id ?? 'new'}`) : `${base}/preview/pages/${page.id ?? 'new'}`;
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const nonce = `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('editorSession', sessionId);
  url.searchParams.set('editorNonce', nonce);
  return url.toString();
}

export function previewAllowedOrigins(frameUrl: string): string[] {
  const configured = runtimeConfig.ONLINE_ORDERING_EDITOR_ORIGINS
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const frameOrigin = editorPreviewOrigin(frameUrl);
  return Array.from(new Set([...(frameOrigin ? [frameOrigin] : []), ...configured]));
}
