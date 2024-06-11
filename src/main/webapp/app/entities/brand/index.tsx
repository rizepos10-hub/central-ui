import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import Brand from "app/entities/brand/brand";
import BrandUpdate from "app/entities/brand/brand-update";
import BrandDeleteDialog from "app/entities/brand/brand-delete-dialog";


const RetailAttributesRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Brand />} />
    <Route path="new" element={<BrandUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<BrandUpdate />} />
      <Route path="delete" element={<BrandDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default RetailAttributesRoutes;
