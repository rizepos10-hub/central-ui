import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import RetailAttributes from "app/entities/item/retail/attributes/retail-attributes";
import RetailAttributeDeleteDialog from "app/entities/item/retail/attributes/attribute-delete-dialog";
import RetailAttributeValuesUpdate from "app/entities/item/retail/attributes/retail-attribute-values-update";


const RetailAttributesRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<RetailAttributes />} />
    {/* <Route path="new" element={<AddonUpdate />} /> */}
    <Route path=":id">
      <Route path="edit" element={<RetailAttributeValuesUpdate />} />
      <Route path="delete" element={<RetailAttributeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default RetailAttributesRoutes;
