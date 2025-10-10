import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './supplier.reducer';
import { ISupplier } from "app/shared/model/STOCK/supplier.model";
import { translate, Translate } from "react-jhipster";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const SupplierUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [supplier, setSupplier] = useState<ISupplier>({
    name: '',
    address: '',
    phoneNumber: null,
    email: ''
  });

  const supplierEntity = useAppSelector(state => state.supplier.entity);
  const loading = useAppSelector(state => state.supplier.loading);
  const updating = useAppSelector(state => state.supplier.updating);


  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (supplierEntity) {
      setSupplier(supplierEntity)
    }
  }, [supplierEntity?.name]);

  const handleChange = e => {

    const { name, value } = e.target;
    setSupplier(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...supplier,
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
            navigate(`/inventory/supplier/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/supplier/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isNew ? `${translate("tempApp.supplier.createNew")}` : `${translate("tempApp.supplier.edit")}`}
        </h2>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-medium">
                  <Translate contentKey={"common.name"} />
                </label>
                <Input
                  type="text"
                  name="name"
                  required={true}
                  id="name"
                  className="h-8 text-xs"
                  value={supplier.name || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="address" className="text-xs font-medium">
                  <Translate contentKey={"common.address"} />
                </label>
                <Input
                  type="text"
                  name="address"
                  id="address"
                  className="h-8 text-xs"
                  value={supplier.address || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <strong className="text-sm font-semibold">
                  <Translate contentKey={"common.contactInformation"} />
                </strong>

                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-medium">
                    <Translate contentKey={"common.email"} />
                  </label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    className="h-8 text-xs"
                    value={supplier?.email || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="phoneNumber" className="text-xs font-medium">
                    <Translate contentKey={"common.phone"} />
                  </label>
                  <Input
                    name="phoneNumber"
                    id="phoneNumber"
                    className="h-8 text-xs"
                    value={supplier?.phoneNumber || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  id="cancel-save"
                  data-cy="entityCreateCancelButton"
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="h-8 text-xs"
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>

                <Button
                  onClick={saveEntity}
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  type="submit"
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>

                <Button
                  onClick={(e) => saveEntity(e, true)}
                  id="save-entity-new"
                  type="submit"
                  disabled={updating}
                  className="h-8 text-xs"
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

export default SupplierUpdate;
