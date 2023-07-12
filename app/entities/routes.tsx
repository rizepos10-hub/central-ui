import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Item from './item';
import Menu from './menu';
import Branch from './branch';
import Attachment from './attachment';
import Customer from './customer';
import Addon from './addon';
import Taxonomy from './taxonomy';
import Term from './term';
import Discount from './discount';
/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="item/*" element={<Item />} />
        <Route path="menu/*" element={<Menu />} />
        <Route path="branch/*" element={<Branch />} />
        <Route path="attachment/*" element={<Attachment />} />
        <Route path="customer/*" element={<Customer />} />
        <Route path="addon/*" element={<Addon />} />
        <Route path="taxonomy/*" element={<Taxonomy />} />
        <Route path="term/*" element={<Term />} />
        <Route path="discount/*" element={<Discount />} />
        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
