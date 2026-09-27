import React from 'react';

import { WholesalePage } from './wholesale-page';

/** Holds a Wholesale route until its page ships, so the menu, route and role checks can land first. */
const WholesalePlaceholderPage = ({ title }: { title: string }) => (
  <WholesalePage title={title}>
    <div className="ws-card px-4 py-6 text-sm text-muted-foreground">This page is not available yet.</div>
  </WholesalePage>
);

export default WholesalePlaceholderPage;
