import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import MixAndMatchRule from './mix-and-match-rule';
import MixAndMatchRuleUpdate from './mix-and-match-rule-update';
import MixAndMatchRuleDeleteDialog from './mix-and-match-rule-delete-dialog';

const MixAndMatchRuleRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<MixAndMatchRule />} />
    <Route path="new" element={<MixAndMatchRuleUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<MixAndMatchRuleUpdate />} />
      <Route path="delete" element={<MixAndMatchRuleDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MixAndMatchRuleRoutes;
