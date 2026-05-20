import { Route } from 'react-router-dom';

import React from 'react';
import ErrorBoundaryRoutes from "app/shared/error/error-boundary-routes";
import Supplier from "app/entities/inventory/supplier";
import SalesLocation from "app/entities/inventory/sales-location";
import Warehouse from "app/entities/inventory/warehouse";
import PurchaseOrder from "app/entities/inventory/purchase-order";
import StockConfig from "app/entities/inventory/stock-config";
import TransferRequest from "app/entities/inventory/transfer-request";
import SupplierReturn from "app/entities/inventory/supplier-return";
import ToBeStocked from "app/entities/inventory/to-be-stocked";
import InventorySettings from "app/entities/inventory/settings";
import { AUTHORITIES } from "app/config/constants";
import PrivateRoute from "app/shared/auth/private-route";

const InventoryRoutes = () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route path="supplier/*" element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN, AUTHORITIES.WAREHOUSE_ADMIN]}>
              <Supplier />
            </PrivateRoute>
          }
        />

        <Route path="sales-location/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN, AUTHORITIES.WAREHOUSE_ADMIN]}>
            <SalesLocation />
          </PrivateRoute>
        }
        />

        <Route path="warehouse/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN, AUTHORITIES.WAREHOUSE_ADMIN]}>
            <Warehouse />
          </PrivateRoute>
        }
        />

        <Route path="purchase-order/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN, AUTHORITIES.WAREHOUSE_ADMIN]}>
            <PurchaseOrder />
          </PrivateRoute>
        }
        />

        <Route path="settings/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN, AUTHORITIES.WAREHOUSE_ADMIN]}>
            <InventorySettings />
          </PrivateRoute>
        }
        />

        <Route path="stock/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN]}>
            <StockConfig />
          </PrivateRoute>
        }
        />

        <Route path="transfer-request/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN]}>
            <TransferRequest />
          </PrivateRoute>
        }
        />

        <Route path="supplier-return/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN]}>
            <SupplierReturn />
          </PrivateRoute>
        }
        />

        <Route path="to-be-stocked/*" element={
          <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.INVENTORY_ADMIN]}>
            <ToBeStocked />
          </PrivateRoute>
        }
        />

      </ErrorBoundaryRoutes>
    </div>
  );
};

export default InventoryRoutes
