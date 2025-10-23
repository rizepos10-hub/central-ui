import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './sales-location.reducer';
import { ISalesLocation } from "app/shared/model/STOCK/sales-location.model";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { translate, Translate } from "react-jhipster";
import Select from 'app/shared/components/select/select';
import { IBranch } from "app/shared/model/branch.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const SalesLocationUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [salesLocation, setSalesLocation] = useState<ISalesLocation>({
    name: '',

  });
  const branchList = useAppSelector(state => state.branch.entities);
  const salesLocationEntity = useAppSelector(state => state.salesLocation.entity);
  const loading = useAppSelector(state => state.salesLocation.loading);
  const updating = useAppSelector(state => state.salesLocation.updating);

  const handleBranchChange = (selectedBranch: IBranch) => {
    setSalesLocation(prevState => ({ ...prevState, branch: selectedBranch }))
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }))
  }, []);

  useEffect(() => {
    if (salesLocationEntity) {
      setSalesLocation(salesLocationEntity)
    }
  }, [salesLocationEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setSalesLocation(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity: ISalesLocation = {
      ...salesLocation,
      type: "SALES_LOCATION"
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
            navigate(`/inventory/sales-location/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/sales-location/new`);
        }
      });
    }
  };

  const customSelectStyles = {
    control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    menu: (base) => ({ ...base, fontSize: '0.75rem' }),
    option: (base) => ({ ...base, fontSize: '0.75rem' }),
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          {isNew ? translate("tempApp.salesLocation.createNew") : translate("tempApp.salesLocation.edit")}
        </h2>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form  className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-medium">
                  <Translate contentKey={"common.name"}>Name</Translate>
                </label>
                <Input
                  type="text"
                  name="name"
                  required={true}
                  id="name"
                  className="h-8 text-xs"
                  value={salesLocation.name || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="location" className="text-xs font-medium">
                  <Translate contentKey={"common.location"}>Location</Translate>
                </label>
                <Input
                  type="text"
                  name="location"
                  id="location"
                  className="h-8 text-xs"
                  value={salesLocation.location || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">
                  <Translate contentKey={"tempApp.table.branch"}>Branch</Translate>
                </label>
                <Select
                  options={branchList}
                  onChange={handleBranchChange}
                  getOptionValue={(option: IBranch) => option.id}
                  getOptionLabel={(option: IBranch) => option.name}
                  name={"branch"}
                  value={salesLocation.branch || null}
                  styles={customSelectStyles}
                />
              </div>

              <div className="flex gap-2 pt-4">
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
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={updating}
                  onClick={saveEntity}
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={updating}
                  onClick={(e) => saveEntity(e, true)}
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

export default SalesLocationUpdate;
