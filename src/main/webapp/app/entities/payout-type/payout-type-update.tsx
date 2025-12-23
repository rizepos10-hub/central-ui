import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IPayoutType } from 'app/shared/model/payout-type.model';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './payout-type.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PayoutTypeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const payoutTypeEntity = useAppSelector(state => state.payoutType.entity);
  const loading = useAppSelector(state => state.payoutType.loading);
  const updating = useAppSelector(state => state.payoutType.updating);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    } else {
      dispatch(reset());
    }
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    if (isNew) {
      dispatch(createEntity(payoutTypeEntity)).then(res => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/payout-type/${newId}/edit`);
        }
      });
    } else {
      dispatch(updateEntity(payoutTypeEntity)).then(() => {
        if (createNew) {
          navigate(`/payout-type/new`);
        }
      });
    }
  };

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">{isNew ? 'Create New Payout Type' : 'Edit Payout Type'}</h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-type-name" className="text-xs">
                Name
              </Label>
              <Input
                id="payout-type-name"
                type="text"
                value={payoutTypeEntity.name ?? ''}
                onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-8 text-xs">
                <ArrowLeft className="h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button size="sm" onClick={saveEntity} type="button" disabled={updating} className="h-8 text-xs">
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button size="sm" onClick={e => saveEntity(e, true)} type="button" disabled={updating} className="h-8 text-xs">
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};

export default PayoutTypeUpdate;
