import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import { LabelFlowProvider } from './store/label-flow-context';
import TemplateListScreen from './screens/TemplateListScreen';
import DesignerScreen from './screens/DesignerScreen';
import ProductSelectionScreen from './screens/ProductSelectionScreen';
import PreviewScreen from './screens/PreviewScreen';
import './labels.scss';

const LabelsRoutes = () => (
  <LabelFlowProvider>
    <ErrorBoundaryRoutes>
      <Route index element={<TemplateListScreen />} />
      <Route path="design/:templateId" element={<DesignerScreen />} />
      <Route path="select/:templateId" element={<ProductSelectionScreen />} />
      <Route path="preview" element={<PreviewScreen />} />
    </ErrorBoundaryRoutes>
  </LabelFlowProvider>
);

export default LabelsRoutes;
