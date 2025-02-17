import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import Barcode from './barcode';

const BarcodeRoutes = () => (
    <ErrorBoundaryRoutes>
        <Route index element={<Barcode />} />
    </ErrorBoundaryRoutes>
);

export default BarcodeRoutes;
