import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './service-charge.reducer';
import { ServiceChargeApplicableOn, ServiceChargeKey, ServiceChargeSettingType, ServiceChargeWhenToApply } from 'app/shared/model/service-charge.model';
import Select from 'react-select'
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ServiceChargeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const serviceChargeEntity = useAppSelector(state => state.serviceCharge.entity);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const updating = useAppSelector(state => state.serviceCharge.updating);
  const branchList = useAppSelector(state => state.branch.entities);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({}));
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      branchId: serviceChargeEntity.branch?.id,
      ...serviceChargeEntity,
      value: {
        ...serviceChargeEntity.value,
        key: serviceChargeEntity.key,
        // minCharge : serviceChargeEntity.value?.setting?.type === ServiceChargeSettingType.PERCENTAGE ? serviceChargeEntity.value?.minCharge : null,
        // maxCharge : serviceChargeEntity.value?.setting?.type === ServiceChargeSettingType.PERCENTAGE ? serviceChargeEntity.value?.maxCharge : null,
        minCharge: null,
        maxCharge: null,
      }
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
            navigate(`/service-charge/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/service-charge/new`)
        }
      })
    }
  };

  const formatServiceChargeKey = (key) => {
    switch (key) {
      case ServiceChargeKey.SHIPPING_FEE:
        return "Shipping Fee";
      case ServiceChargeKey.WRAPPING_FEE:
        return "Wrapping Fee";
      case ServiceChargeKey.GRATUITY:
        return "Gratuity";
      case ServiceChargeKey.OTHER:
        return "Other";
      default:
        return key;
    }
  };

  const formatServiceChargeSettingType = (type) => {
    switch (type) {
      case ServiceChargeSettingType.FIXED:
        return "Fixed";
      case ServiceChargeSettingType.PERCENTAGE:
        return "Percentage";
      default:
        return type;
    }
  };

  const formatServiceChargeWhenToApply = (whenToApply) => {
    switch (whenToApply) {
      case ServiceChargeWhenToApply.AUTOMATIC:
        return "Automatic";
      case ServiceChargeWhenToApply.ON_DEMAND:
        return "On Demand";
      default:
        return whenToApply;
    }
  };

  const formatServiceChargeApplicableOn = (applicableOn) => {
    switch (applicableOn) {
      case ServiceChargeApplicableOn.DELIVERY:
        return "Delivery";
      case ServiceChargeApplicableOn.PICKUP:
        return "Pickup";
      case ServiceChargeApplicableOn.DINE_IN:
        return "Dine In";
      case ServiceChargeApplicableOn.WALK_IN:
        return "Walk In";
      default:
        return applicableOn;
    }
  };

  const serviceChargeKeys = Object.keys(ServiceChargeKey).map(key => ({ label: formatServiceChargeKey(key), value: ServiceChargeKey[key] }));
  const whenToApplyOptions = Object.keys(ServiceChargeWhenToApply).map(key => ({ label: formatServiceChargeWhenToApply(key), value: ServiceChargeWhenToApply[key] }));
  const typeOptions = Object.keys(ServiceChargeSettingType).map(key => ({ label: formatServiceChargeSettingType(key), value: ServiceChargeSettingType[key] }));
  const applicableOnOptions = Object.keys(ServiceChargeApplicableOn).map(key => ({ label: formatServiceChargeApplicableOn(key), value: ServiceChargeApplicableOn[key] }));


  const handleApplicableOnChange = (selectedOptions) => {
    const newValue = selectedOptions.map(option => option.value);
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, 'setting.applicableOn', newValue);

    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }

  const handleTypeChange = (selectedOption) => {
    const newValue = selectedOption.value;
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, 'setting.type', newValue);
    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }

  const handleBranchChange = (selectedOption) => {
    const newValue = selectedOption.value;
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.branch || {});
    _.set(updatedEntity, 'id', newValue);
    dispatch(changeEntityField({ name: 'branch', value: updatedEntity }));
  }

  const handleValueChange = (field, value) => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity?.value || {});
    _.set(updatedEntity, field, value);
    dispatch(changeEntityField({ name: 'value', value: updatedEntity }));
  }


  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">
        {isNew ? "Create New Service Charge" : "Edit Service Charge"}
      </h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-charge-key" className="text-xs">{translate('service-charge.settings.type')}</Label>
                <Select
                  id="service-charge-key"
                  value={serviceChargeEntity.key ? serviceChargeKeys.find(k => k.value === serviceChargeEntity.key) : null}
                  onChange={(option) => dispatch(changeEntityField({ name: 'key', value: option?.value }))}
                  options={serviceChargeKeys}
                  placeholder="Select Type"
                  isClearable
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-charge-name" className="text-xs">{translate('service-charge.name')}</Label>
                <Input
                  id="service-charge-name"
                  value={serviceChargeEntity.value?.name || ''}
                  onChange={e => handleValueChange('name', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-charge-type" className="text-xs">{translate('service-charge.settings.calculationType')}</Label>
                <Select
                  id="service-charge-type"
                  value={serviceChargeEntity.value?.setting?.type ? typeOptions.find(t => t.value === serviceChargeEntity.value.setting.type) : null}
                  onChange={handleTypeChange}
                  options={typeOptions}
                  placeholder="Select Calculation Type"
                  isClearable
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-charge-applicableOn" className="text-xs">{translate('service-charge.applicableOn')}</Label>
                <Select
                  id="service-charge-applicableOn"
                  options={applicableOnOptions}
                  value={applicableOnOptions.filter(option => serviceChargeEntity.value?.setting?.applicableOn?.includes(option.value)) || null}
                  onChange={handleApplicableOnChange}
                  isMulti
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-charge-whenToApply" className="text-xs">{translate('service-charge.whenToApply')}</Label>
                <Select
                  id="service-charge-whenToApply"
                  value={serviceChargeEntity.value?.whenToApply ? whenToApplyOptions.find(w => w.value === serviceChargeEntity.value.whenToApply) : null}
                  options={whenToApplyOptions}
                  onChange={(option) => handleValueChange('whenToApply', option?.value)}
                  placeholder="Select When To Apply"
                  isClearable
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-charge-branch" className="text-xs">{translate('service-charge.branch')}</Label>
                <Select
                  id="service-charge-branch"
                  value={serviceChargeEntity.branch?.id ? { label: branchList.find(b => b.id === serviceChargeEntity.branch.id)?.name, value: serviceChargeEntity.branch.id } : null}
                  onChange={(option) => handleBranchChange({ value: option?.value })}
                  options={branchList.map(branch => ({ label: branch.name, value: branch.id }))}
                  placeholder="Select a Branch"
                  isClearable
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-charge-charge" className="text-xs">{translate('service-charge.charge')}</Label>
              <Input
                id="service-charge-charge"
                type="number"
                step="0.01"
                value={serviceChargeEntity.value?.charge || 0}
                onChange={(e) => handleValueChange('charge', parseFloat(e.target.value))}
                required
                className="h-8 text-xs"
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

export default ServiceChargeUpdate;