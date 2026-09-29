import React, { createContext, useContext, useState } from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

const WholesalePortalContext = createContext<HTMLElement | null>(null);

/**
 * The themed page root, for overlays (dialogs, selects, menus...) that would otherwise open in document.body
 * outside `.theme-wholesale`. Undefined outside a WholesalePage, so they fall back to the body.
 */
export const useWholesalePortalContainer = (): HTMLElement | undefined => useContext(WholesalePortalContext) ?? undefined;

interface WholesalePageProps {
  title?: React.ReactNode;
  /** One line under the title: delivery date, factory, cut-off... */
  context?: React.ReactNode;
  /** Right-aligned header buttons. */
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/** Root of every new Wholesale page: applies `.theme-wholesale` and hosts the page's overlays. */
export const WholesalePage = ({ title, context, actions, className, children }: WholesalePageProps) => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <WholesalePortalContext.Provider value={root}>
      <div ref={setRoot} data-testid="wholesale-page" className={cn('theme-wholesale min-h-full', className)}>
        <div className="flex flex-col gap-4 px-6 py-5">
          {(title || context || actions) && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0">
                {title && <h1 className="m-0 text-xl font-semibold leading-tight">{title}</h1>}
                {context && <div className="mt-0.5 text-[13px] text-muted-foreground">{context}</div>}
              </div>
              <div className="flex-1" />
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    </WholesalePortalContext.Provider>
  );
};

/** Applies the Wholesale theme to existing pages that keep their own layout, and hosts their overlays. */
export const WholesaleThemeScope = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <WholesalePortalContext.Provider value={root}>
      <div ref={setRoot} data-testid="wholesale-theme-scope" className={cn('theme-wholesale min-h-full', className)}>
        {children}
      </div>
    </WholesalePortalContext.Provider>
  );
};

export default WholesalePage;
