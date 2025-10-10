import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './warehouse.reducer';
import { IWarehouse } from 'app/shared/model/STOCK/warehouse.model';
import { translate, Translate } from 'react-jhipster';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const WarehouseUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [warehouse, setWarehouse] = useState<IWarehouse>({});

  const warehouseEntity = useAppSelector(state => state.warehouse.entity);
  const loading = useAppSelector(state => state.warehouse.loading);
  const updating = useAppSelector(state => state.warehouse.updating);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (warehouseEntity) {
      setWarehouse(warehouseEntity)
    }
  }, [warehouseEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setWarehouse(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...warehouse,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/inventory/warehouse/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/warehouse/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-bold mb-4">
            {isNew ? `${translate('tempApp.warehouse.createNew')}` : `${translate('tempApp.warehouse.edit')}`}
          </h2>

          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); saveEntity(e); }}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-medium">
                    <Translate contentKey={'common.name'}>Name</Translate>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    required
                    id="name"
                    className="h-8 text-xs"
                    value={warehouse.name || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="location" className="text-xs font-medium">
                    <Translate contentKey={'common.location'}>Location</Translate>
                  </label>
                  <Input
                    type="text"
                    name="location"
                    id="location"
                    className="h-8 text-xs"
                    value={warehouse.location || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    name="main"
                    id="main"
                    checked={warehouse?.main === true}
                    onCheckedChange={(checked) => setWarehouse(prev => ({ ...prev, main: checked === true }))}
                  />
                  <label htmlFor="main" className="text-xs font-medium cursor-pointer">
                    <Translate contentKey={'tempApp.warehouse.main'}>Main Warehouse</Translate>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={(e) => saveEntity(e, true)}
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default WarehouseUpdate;
