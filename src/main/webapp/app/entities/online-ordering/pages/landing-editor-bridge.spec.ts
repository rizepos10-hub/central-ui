import { editorPreviewUrl, getEditorPreviewBaseUrl } from './landing-editor-bridge';
import { defaultPageValue } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';

describe('landing editor preview URL', () => {
  it('uses the local Online Ordering dev server in development', () => {
    expect(getEditorPreviewBaseUrl('https://configured-storefront.example', true)).toBe('http://localhost:3000');
  });

  it('uses the configured storefront domain outside development', () => {
    expect(getEditorPreviewBaseUrl('https://configured-storefront.example/', false)).toBe('https://configured-storefront.example');
  });

  it('preserves the editor query contract for the configured storefront URL', () => {
    const url = editorPreviewUrl({ ...defaultPageValue, id: 'page-1' }, 'https://configured-storefront.example');
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://configured-storefront.example');
    expect(parsed.pathname).toBe('/preview/pages/page-1');
    expect(parsed.searchParams.get('editorView')).toBe('landing');
    expect(parsed.searchParams.get('editorSession')).toEqual(expect.any(String));
    expect(parsed.searchParams.get('editorNonce')).toEqual(expect.any(String));
  });
});
