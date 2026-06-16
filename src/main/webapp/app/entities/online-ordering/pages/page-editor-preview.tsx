import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IOnlineOrderingPage } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.model';
import { PageStatus } from 'app/shared/model/ONLINE_ORDERING/online-ordering-page.enums';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import PageTemplatePreview from './page-template-preview';
import {
  canOpenLivePreview,
  getLivePreviewUrl,
  isPageActiveLanding,
  LOCAL_STOREFRONT_URL,
} from './page-preview-utils';

type PageEditorPreviewProps = {
  page: IOnlineOrderingPage;
  uiSettings: IUiSettings;
  onSetActiveAndPreview?: () => void;
  settingActive?: boolean;
};

const PreviewLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
  >
    {label}
    <ExternalLink className="h-3 w-3" />
  </a>
);

export const PageEditorPreview = ({ page, uiSettings, onSetActiveAndPreview, settingActive }: PageEditorPreviewProps) => {
  const isActive = isPageActiveLanding(page, uiSettings);
  const isPublished = page.status === PageStatus.PUBLISHED;
  const liveUrl = getLivePreviewUrl(uiSettings);
  const canLivePreview = canOpenLivePreview(page, uiSettings);

  return (
    <Card>
      <CardHeader className="p-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Template preview</CardTitle>
        <div className="flex items-center gap-2">
          {isActive && <Badge variant="secondary">Active landing page</Badge>}
          {isPublished ? (
            <Badge variant="outline">Published</Badge>
          ) : (
            <Badge variant="outline">Draft — publish to preview on storefront</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 flex flex-col md:flex-row gap-4">
        <PageTemplatePreview page={page} showLinks={false} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The storefront home route shows whichever landing page is set as active. Use the links below to open the
            online ordering UI and verify this template.
          </p>

          <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
            <PreviewLink href={LOCAL_STOREFRONT_URL} label="Open local storefront (localhost:3000)" />
            {liveUrl && <PreviewLink href={liveUrl} label={`Open production storefront (${uiSettings.domain})`} />}
          </div>

          {canLivePreview ? (
            <p className="text-xs text-emerald-700">
              This page is active and published — the storefront home should match this template.
            </p>
          ) : (
            <p className="text-xs text-amber-700">
              {!isPublished
                ? 'Publish this page, then set it as active to see it on the storefront home.'
                : !isActive
                  ? 'This page is not the active landing page yet. Set it active to preview it on the home route.'
                  : 'Configure a storefront domain in Online Ordering settings to enable the production preview link.'}
            </p>
          )}

          {onSetActiveAndPreview && page.id && isPublished && !isActive && (
            <Button className="h-8 w-fit text-xs" disabled={settingActive} onClick={onSetActiveAndPreview}>
              Set active &amp; open preview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PageEditorPreview;
