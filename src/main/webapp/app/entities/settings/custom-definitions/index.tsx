import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CustomDefinition from './custom-definitions';
import CustomDefinitionsUpdate from './custom-definitions-update';
import CustomDefinitionsDelete from './custom-defnitions-delete';


const CustomDefinitionSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CustomDefinition />} />
    <Route path="new" element={<CustomDefinitionsUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<CustomDefinitionsUpdate />} />
      <Route path="delete" element={<CustomDefinitionsDelete />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CustomDefinitionSettingsRoutes;
