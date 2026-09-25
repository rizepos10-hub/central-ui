import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Printer from './printer';
import PrinterUpdate from './printer-update';
import PrinterDeleteDialog from './printer-delete-dialog';
import MasterKitchenTemplate from './master-kitchen-template';

const PrinterRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Printer />} />
    <Route path="master-template" element={<MasterKitchenTemplate />} />
    <Route path="new" element={<PrinterUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PrinterUpdate />} />
      <Route path="delete" element={<PrinterDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PrinterRoutes;
