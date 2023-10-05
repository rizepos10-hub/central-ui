import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Printer from './printer';
import PrinterDetail from './printer-detail';
import PrinterUpdate from './printer-update';
import PrinterDeleteDialog from './printer-delete-dialog';

const PrinterRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Printer />} />
    <Route path="new" element={<PrinterUpdate />} />
    <Route path=":id">
      <Route index element={<PrinterDetail />} />
      <Route path="edit" element={<PrinterUpdate />} />
      <Route path="delete" element={<PrinterDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PrinterRoutes;
