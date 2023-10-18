import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PrintingProfileDetail from './printing-profile-detail';
import PrintingProfileUpdate from './printing-profile-update';
import PrintingProfileDeleteDialog from './printing-profile-delete-dialog';
import PrintingProfile from "app/entities/settings/printing/printing-profiles/printing-profile";
import PrintingProfileEdit from "app/entities/settings/printing/printing-profiles/printing-profile-update";
import AddonUpdate from "app/entities/addon/addon-update";


const PrintingProfileRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PrintingProfile />} />
    <Route path="new" element={<PrintingProfileEdit />} />

    <Route path=":id">
      <Route index element={<PrintingProfileEdit />} />
      <Route path="edit" element={<PrintingProfileEdit />} />
      <Route path="delete" element={<PrintingProfileDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PrintingProfileRoutes;
