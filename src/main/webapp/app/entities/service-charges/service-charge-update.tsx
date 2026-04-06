import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './service-charge.reducer';
import {
  ServiceChargeOrderMethod,
  ServiceChargeKey,
  ServiceChargeCalculationMethod,
  ServiceChargeWhenToApply,
  IServiceCharge,
  DeliveryProviderKey,
  SubtotalComparisonOperator,
} from 'app/shared/model/service-charge.model';
import { IPaymentMethodSetting } from 'app/shared/model/payment-method-setting.model';
import { getAllEntities as getAllPaymentMethodSettings } from 'app/entities/settings/payment-method-setting/payment-method-setting.reducer';
import Select from 'react-select'
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEntities as getProfileGroups } from 'app/entities/settings/profile-group/profile-group.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';


export const ServiceChargeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const serviceChargeEntity : IServiceCharge = useAppSelector(state => state.serviceCharge.entity);
  const loading = useAppSelector(state => state.serviceCharge.loading);
  const updating = useAppSelector(state => state.serviceCharge.updating);
  const branchList = useAppSelector(state => state.branch.entities);
  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);
  const allPaymentMethodSettings = useAppSelector(state => state.paymentMethodSetting.entities);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    } else {
      dispatch(reset())
    }
    dispatch(getBranches({}));
    
    dispatch(
      getProfileGroups({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    // Fetch payment method settings
    dispatch(getAllPaymentMethodSettings());
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    setValidationError(null);

    const hasConditional =
      !!serviceChargeEntity?.setting?.chargeCalculationSetting?.percentageOnCondition ||
      !!serviceChargeEntity?.setting?.chargeCalculationSetting?.flatOnCondition;
    const hasLegacyCharge = serviceChargeEntity?.charge !== undefined && serviceChargeEntity?.charge !== null;
    if (serviceChargeEntity?.key === ServiceChargeKey.PLATFORM_FEE && hasConditional && hasLegacyCharge) {
      setValidationError('For PLATFORM_FEE use either legacy charge OR conditional fee rules, not both.');
      return;
    }

    if (isNew) {
      dispatch(createEntity(serviceChargeEntity)).then((res) => {
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
      dispatch(updateEntity(serviceChargeEntity)).then(() => {
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
      case ServiceChargeKey.PLATFORM_FEE:
        return "Platform fee (delivery)";
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
      case ServiceChargeCalculationMethod.FIXED:
        return "Fixed";
      case ServiceChargeCalculationMethod.PERCENTAGE:
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
      case ServiceChargeOrderMethod.DELIVERY:
        return "Delivery";
      case ServiceChargeOrderMethod.PICKUP:
        return "Pickup";
      case ServiceChargeOrderMethod.DINE_IN:
        return "Dine In";
      case ServiceChargeOrderMethod.WALK_IN:
        return "Walk In";
      default:
        return applicableOn;
    }
  };

  const formatServiceChargeOrderSource = (source) => {
    switch (source) {
      case SourceType.ONLINE_ORDERING:
        return "Online Ordering";
      case SourceType.BRANCH_POS:
        return "Branch POS";
      default:
        return source;
    }
  };

  const serviceChargeKeys = Object.keys(ServiceChargeKey).map(key => ({ label: formatServiceChargeKey(key), value: ServiceChargeKey[key] }));
  const whenToApplyOptions = Object.keys(ServiceChargeWhenToApply).map(key => ({ label: formatServiceChargeWhenToApply(key), value: ServiceChargeWhenToApply[key] }));
  const typeOptions = Object.keys(ServiceChargeCalculationMethod).map(key => ({ label: formatServiceChargeSettingType(key), value: ServiceChargeCalculationMethod[key] }));
  const applicableOnOptions = Object.keys(ServiceChargeOrderMethod).map(key => ({ label: formatServiceChargeApplicableOn(key), value: ServiceChargeOrderMethod[key] }));
  const orderSourceOptions = Object.keys(SourceType).map(key => ({ label: formatServiceChargeOrderSource(SourceType[key]), value: SourceType[key] }));
  // Filter to only show settings where show === true
  const visiblePaymentMethodSettings = allPaymentMethodSettings.filter(setting => setting.show === true);
  const transactionMethodOptions = visiblePaymentMethodSettings.map(setting => ({ 
    label: (setting.name || (setting.transactionMethod ? String(setting.transactionMethod) : '') || '') as string, 
    value: setting 
  }));

  const handleWhenToApplyChange = (option) => {
    const newValue = option?.value;
    if (newValue !== ServiceChargeWhenToApply.AUTOMATIC) {
      const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
      _.set(updatedEntity, 'setting.applicableOn.orderMethods', []);
      _.set(updatedEntity, 'setting.applicableOn.orderSources', []);
      _.set(updatedEntity, 'setting.applicableOn.transactionMethods', []);
      dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
    }
    dispatch(changeEntityField({ name: 'whenToApply', value: newValue }));
  };

  const handleApplicableOnChange = (selectedOptions) => {
    const newValue = selectedOptions.map(option => option.value);
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.applicableOn.orderMethods', newValue);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleOrderSourcesChange = (selectedOptions) => {
    const newValue = selectedOptions.map(option => option.value);
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.applicableOn.orderSources', newValue);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleTransactionMethodsChange = (selectedOptions) => {
    // selectedOptions is an array of { label, value } where value is IPaymentMethodSetting
    const newValue = selectedOptions ? selectedOptions.map(option => option.value) : [];
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.applicableOn.transactionMethods', newValue);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleMethodChange = (selectedOption) => {
    const newValue = selectedOption.value;
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.method', newValue);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleDiscountableChange = (checked) => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.discountable', checked);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleLoyaltyEligibleChange = (checked) => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.loyaltyEligible', checked);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  }

  const handleBranchesChange = (selectedOptions) => {
    const selectedBranches = selectedOptions.map(option => branchList.find(b => b.id === option.value)).filter(Boolean);
    dispatch(changeEntityField({ name: 'branches', value: selectedBranches }));
  };

  const handleKeyChange = option => {
    const v = option?.value as ServiceChargeKey | undefined;
    dispatch(changeEntityField({ name: 'key', value: v }));
    if (v !== ServiceChargeKey.PLATFORM_FEE) {
      dispatch(changeEntityField({ name: 'deliveryProvider', value: undefined }));
      const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
      _.unset(updatedEntity, 'setting.chargeCalculationSetting');
      dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
    }
  };

  const updateConditionalSetting = (path: string, value: unknown) => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, path, value);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  };

  const applyTookanDefaultRule = () => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.set(updatedEntity, 'setting.chargeCalculationSetting.percentageOnCondition.percentCharge', 10);
    _.set(updatedEntity, 'setting.chargeCalculationSetting.percentageOnCondition.maxCharge', 6.5);
    _.set(updatedEntity, 'setting.chargeCalculationSetting.flatOnCondition.amountCharge', 2.5);
    _.set(
      updatedEntity,
      'setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.comparisonOperator',
      SubtotalComparisonOperator.LESS_THAN
    );
    _.set(updatedEntity, 'setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.subTotal', 18);
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
    dispatch(changeEntityField({ name: 'charge', value: undefined }));
  };

  const clearConditionalRule = () => {
    const updatedEntity = _.cloneDeep(serviceChargeEntity || {});
    _.unset(updatedEntity, 'setting.chargeCalculationSetting');
    dispatch(changeEntityField({ name: 'setting', value: updatedEntity.setting }));
  };

  const deliveryProviderOptions = [
    { label: 'Tookan', value: 'TOOKAN' as DeliveryProviderKey },
    { label: 'Icabbi', value: 'ICABBI' as DeliveryProviderKey },
  ];


  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">
        {isNew ? "Create New Service Charge" : "Edit Service Charge"}
      </h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-6">
            {validationError && (
              <Alert className="border-destructive/40 bg-destructive/5">
                <AlertDescription className="text-xs text-destructive">{validationError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-charge-key" className="text-xs">{translate('service-charge.settings.type')}</Label>
                  <Select
                    id="service-charge-key"
                    value={serviceChargeEntity.key ? serviceChargeKeys.find(k => k.value === serviceChargeEntity.key) : null}
                    onChange={handleKeyChange}
                    options={serviceChargeKeys}
                    placeholder="Select Type"
                    isClearable
                  />
                </div>
                {serviceChargeEntity.key === ServiceChargeKey.PLATFORM_FEE && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="platform-delivery-provider" className="text-xs">
                      Delivery provider (required)
                    </Label>
                    <Select
                      inputId="platform-delivery-provider"
                      value={deliveryProviderOptions.find(o => o.value === serviceChargeEntity.deliveryProvider) || null}
                      onChange={opt => dispatch(changeEntityField({ name: 'deliveryProvider', value: opt?.value }))}
                      options={deliveryProviderOptions}
                      placeholder="Select provider"
                    />
                    <Alert className="border-muted bg-muted/30">
                      <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
                        This fee applies only when checkout uses the <strong>same</strong> delivery provider. It does{' '}
                        <strong>not</strong> replace distance-based delivery fees — those are set under{' '}
                        <Link to="/branches" className="font-medium text-primary underline-offset-2 hover:underline">
                          Branches → Delivery pricing
                        </Link>
                        .
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="service-charge-name" className="text-xs">{translate('service-charge.name')}</Label>
                  <Input
                    id="service-charge-name"
                    value={serviceChargeEntity.name || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-charge-whenToApply" className="text-xs">{translate('service-charge.whenToApply')}</Label>
                  <Select
                    id="service-charge-whenToApply"
                    value={serviceChargeEntity.whenToApply ? whenToApplyOptions.find(w => w.value === serviceChargeEntity.whenToApply) : null}
                    options={whenToApplyOptions}
                    onChange={handleWhenToApplyChange}
                    placeholder="Select When To Apply"
                    isClearable
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-charge-branches" className="text-xs">{translate('service-charge.branches')}</Label>
                  <Select
                    id="service-charge-branches"
                    value={serviceChargeEntity.branches?.map(branch => ({ label: branch.name, value: branch.id })) || []}
                    onChange={handleBranchesChange}
                    options={branchList.map(branch => ({ label: branch.name, value: branch.id }))}
                    placeholder="Select Branches"
                    isMulti
                    isClearable
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-charge-method" className="text-xs">{translate('service-charge.settings.calculationType')}</Label>
                  <Select
                    id="service-charge-method"
                    value={serviceChargeEntity.setting?.method ? typeOptions.find(t => t.value === serviceChargeEntity.setting.method) : null}
                    onChange={handleMethodChange}
                    options={typeOptions}
                    placeholder="Select Calculation Method"
                    isClearable
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-charge-charge" className="text-xs">{translate('service-charge.charge')}</Label>
                  <Input
                    id="service-charge-charge"
                    type="number"
                    step="0.01"
                    value={serviceChargeEntity.charge || 0}
                    onChange={(e) => dispatch(changeEntityField({ name: 'charge', value: parseFloat(e.target.value) }))}
                    className="h-9 text-xs"
                    disabled={serviceChargeEntity.key === ServiceChargeKey.PLATFORM_FEE && !!serviceChargeEntity?.setting?.chargeCalculationSetting}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Profile Group
                  </Label>
                  <Select
                    value={serviceChargeEntity?.accountingGroup}
                    isClearable
                    options={profileGroupsOptions}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={(e) => dispatch(changeEntityField({ name: 'accountingGroup', value:  e }))}
                    onMenuOpen={() => {
                      dispatch(
                        getProfileGroups({
                          page: paginationState.activePage - 1,
                          size: paginationState.itemsPerPage,
                          sort: `${paginationState.sort},${paginationState.order}`,
                        })
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {serviceChargeEntity.key === ServiceChargeKey.PLATFORM_FEE && (
                <div className="grid gap-4 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Conditional Platform Fee Rules</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={clearConditionalRule}>
                        Clear rules
                      </Button>
                      <Button type="button" size="sm" className="h-7 text-xs" onClick={applyTookanDefaultRule}>
                        Use Tookan default
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Percentage charge (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceChargeEntity?.setting?.chargeCalculationSetting?.percentageOnCondition?.percentCharge ?? ''}
                        onChange={e =>
                          updateConditionalSetting(
                            'setting.chargeCalculationSetting.percentageOnCondition.percentCharge',
                            e.target.value === '' ? undefined : parseFloat(e.target.value)
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Max fee cap (flat amount)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceChargeEntity?.setting?.chargeCalculationSetting?.percentageOnCondition?.maxCharge ?? ''}
                        onChange={e =>
                          updateConditionalSetting(
                            'setting.chargeCalculationSetting.percentageOnCondition.maxCharge',
                            e.target.value === '' ? undefined : parseFloat(e.target.value)
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Flat amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceChargeEntity?.setting?.chargeCalculationSetting?.flatOnCondition?.amountCharge ?? ''}
                        onChange={e =>
                          updateConditionalSetting(
                            'setting.chargeCalculationSetting.flatOnCondition.amountCharge',
                            e.target.value === '' ? undefined : parseFloat(e.target.value)
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Flat subtotal operator</Label>
                      <Select
                        value={
                          serviceChargeEntity?.setting?.chargeCalculationSetting?.flatOnCondition?.subtotalCondition?.comparisonOperator
                            ? {
                                label:
                                  serviceChargeEntity.setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.comparisonOperator,
                                value:
                                  serviceChargeEntity.setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.comparisonOperator,
                              }
                            : null
                        }
                        onChange={option =>
                          updateConditionalSetting(
                            'setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.comparisonOperator',
                            option?.value
                          )
                        }
                        options={Object.values(SubtotalComparisonOperator).map(v => ({ label: v, value: v }))}
                        placeholder="Select operator"
                        isClearable
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Flat subtotal value</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={serviceChargeEntity?.setting?.chargeCalculationSetting?.flatOnCondition?.subtotalCondition?.subTotal ?? ''}
                        onChange={e =>
                          updateConditionalSetting(
                            'setting.chargeCalculationSetting.flatOnCondition.subtotalCondition.subTotal',
                            e.target.value === '' ? undefined : parseFloat(e.target.value)
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <Alert className="border-muted bg-muted/30">
                    <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
                      Conditional rules are evaluated on subtotal. Max cap is an absolute fee amount (currency), not a percentage.
                      When configured, do not set legacy charge at the same time.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {serviceChargeEntity.whenToApply === ServiceChargeWhenToApply.AUTOMATIC && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="service-charge-applicableOn" className="text-xs">{translate('service-charge.applicableOn')}</Label>
                    <Select
                      id="service-charge-applicableOn"
                      options={applicableOnOptions}
                      value={applicableOnOptions.filter(option => serviceChargeEntity.setting?.applicableOn?.orderMethods?.includes(option.value)) || null}
                      onChange={handleApplicableOnChange}
                      isMulti
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-charge-orderSources" className="text-xs">{translate('service-charge.orderSources') || 'Order Sources'}</Label>
                    <Select
                      id="service-charge-orderSources"
                      options={orderSourceOptions}
                      value={orderSourceOptions.filter(option => serviceChargeEntity.setting?.applicableOn?.orderSources?.includes(option.value)) || null}
                      onChange={handleOrderSourcesChange}
                      isMulti
                      isClearable
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-charge-transactionMethods" className="text-xs">{translate('service-charge.transactionMethods') || 'Transaction Methods'}</Label>
                    <Select
                      id="service-charge-transactionMethods"
                      options={transactionMethodOptions}
                      value={transactionMethodOptions.filter(option => {
                        const selectedMethods = serviceChargeEntity.setting?.applicableOn?.transactionMethods || [];
                        return selectedMethods.some(method => method?.id === option.value?.id);
                      })}
                      onChange={handleTransactionMethodsChange}
                      isMulti
                      isClearable
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value?.id || ''}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 md:w-1/2">
                <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                  <input
                    type="checkbox"
                    id="service-charge-discountable"
                    checked={serviceChargeEntity.setting?.discountable || false}
                    onChange={(e) => handleDiscountableChange(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">{translate('service-charge.discountable')}</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                  <input
                    type="checkbox"
                    id="service-charge-loyaltyEligible"
                    checked={serviceChargeEntity.setting?.loyaltyEligible || false}
                    onChange={(e) => handleLoyaltyEligibleChange(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">{translate('service-charge.loyaltyEligible')}</span>
                </label>
              </div>
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