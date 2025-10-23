import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IDiscount } from 'app/shared/model/discount.model';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './discount.reducer';
import Select from 'app/shared/components/select/select';
import { DiscountType } from "app/shared/model/ENUMS/discount-type.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const DiscountUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const discountEntity = useAppSelector(state => state.discount.entity);
  const loading = useAppSelector(state => state.discount.loading);
  const updating = useAppSelector(state => state.discount.updating);
  const discountTypeValuesOptions = Object.keys(DiscountType).map(opt => ({ label: opt, value: opt }));

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
      dispatch(createEntity(discountEntity)).then((res) => {
         if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/discount/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(discountEntity)).then(() => {
        if (createNew) {
          navigate(`/discount/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">
        {isNew ? translate("tempApp.createNewDiscount") : translate("tempApp.editDiscount")}
      </h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount-value" className="text-xs">{translate('tempApp.value')}</Label>
              <Input
                id="discount-value"
                type="number"
                value={discountEntity.value || ''}
                onChange={e => dispatch(changeEntityField({ name: 'value', value: parseFloat(e.target.value) }))}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-type" className="text-xs">{translate('tempApp.type')}</Label>
              <Select
                id="discount-type"
                name="type"
                required
                options={discountTypeValuesOptions}
                value={discountEntity?.type ? { label: discountEntity?.type, value: discountEntity?.type } : null}
                onChange={(selectedType: { label: string, value: string }) => dispatch(changeEntityField({ name: 'type', value: selectedType?.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 text-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                size="sm"
                onClick={saveEntity}
                type="button"
                disabled={updating}
                className="h-8 text-xs"
              >
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button
                size="sm"
                onClick={(e) => saveEntity(e, true)}
                type="button"
                disabled={updating}
                className="h-8 text-xs"
              >
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

export default DiscountUpdate;
