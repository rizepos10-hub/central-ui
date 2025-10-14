// PurchaseConfigUpdate.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './purchase-config.reducer';
import { getEntities as getSuppliers } from '../supplier/supplier.reducer';
import { IPurchaseConfig } from 'app/shared/model/STOCK/purchase-config.model';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState, translate } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import PurchaseConfigUpdateTab from './purchase-config-update-tab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const PurchaseConfigUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const variantId = searchParams.get('variantId');
  const itemId = searchParams.get('itemId');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [paginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [purchaseConfig, setPurchaseConfig] = useState<IPurchaseConfig>({
    supplierConfigurations: []
  });

  const fetchedEntity = useAppSelector(state => state.purchaseConfig.entity);
  const updating = useAppSelector(state => state.purchaseConfig.updating);
  const updateSuccess = useAppSelector(state => state.purchaseConfig.updateSuccess);

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getSuppliers({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`
      })
    );
    return () => {
      dispatch(reset());
    };
  }, []);

  // Sync fetched entity once (when available)
  useEffect(() => {
    if (!isNew && fetchedEntity && fetchedEntity.id && fetchedEntity.id !== purchaseConfig.id) {
      setPurchaseConfig(fetchedEntity);
    }
  }, [fetchedEntity, isNew, purchaseConfig.id]);

  const handleConfigChange = (config: IPurchaseConfig, variantIndex: number) => {
    setPurchaseConfig(config);
  };

  const saveEntity = () => {
    console.log(purchaseConfig, 'purchaseConfig')
    const entity = {
      ...purchaseConfig,
      ...(isNew && { variantId, itemId })
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">
        {isNew
          ? translate('tempApp.stockConfig.addNewPurchaseConfig')
          : translate('tempApp.stockConfig.editPurchaseConfig')}
      </h2>

      <Card className="max-w-4xl">
        <CardContent className="p-4">
          <PurchaseConfigUpdateTab
            purchaseConfig={purchaseConfig}
            onConfigChange={handleConfigChange}
            variantIndex={0}
            id={purchaseConfig?.id}
          />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              {translate('common.back')}
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={saveEntity} disabled={updating}>
              <Save className="h-3 w-3 mr-1" />
              {translate('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseConfigUpdate;
