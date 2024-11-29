import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import CourseDefinition from './course-definition';
import CourseDefinitionUpdate from './course-definition-update';
import CourseDefinitionDeleteDialog from './ccourse-definition-delete-dialog';



const CourseDefinitionRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CourseDefinition />} />
    <Route path="new" element={<CourseDefinitionUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<CourseDefinitionUpdate />} />
      <Route path="delete" element={<CourseDefinitionDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CourseDefinitionRoutes;
