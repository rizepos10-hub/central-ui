import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './pricing-point.reducer';
import _ from 'lodash';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { ApplicationTypes, AutomaticType, IPricingPoint, PricingPointType } from 'app/shared/model/PRICING-POINT/pricing-point';
import { DiscountType } from 'app/shared/model/ENUMS/discount-type.model';
import { IDiscount } from 'app/shared/model/discount.model';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import ReactSelect from 'react-select'
import { IBranch } from 'app/shared/model/branch.model';

const NO_DISCOUNT = 'NONE';

/** A missing type or a non-positive value means the point has no discount. Percentage cannot pass 100. */
const discountToSave = (discount?: IDiscount | null): { discount: IDiscount | null; error: string | null } => {
  if (!discount?.type) {
    return { discount: null, error: null };
  }
  const value = Number(discount.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { discount: null, error: 'Enter a discount greater than 0, or choose No discount.' };
  }
  if (discount.type === DiscountType.PERCENTAGE && value > 100) {
    return { discount: null, error: 'A percentage discount cannot be more than 100.' };
  }
  return { discount: { id: discount.id, type: discount.type, value }, error: null };
};

export const PricingPointUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const pricingPoint: IPricingPoint = useAppSelector(state => state.pricingPoint.entity);
  const loading = useAppSelector(state => state.pricingPoint.loading);
  const updating = useAppSelector(state => state.pricingPoint.updating);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      dispatch(getEntity(id));
    } else {
      dispatch(reset());
    }
    dispatch(getBranches({
      page: 0,
      size: 500,
      sort: 'asc',
    }));
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const { discount, error } = discountToSave(pricingPoint.discount);
    if (error) {
      setDiscountError(error);
      return;
    }
    setDiscountError(null);

    const entity: IPricingPoint = {
      ...pricingPoint,
      discount,
      automaticType: pricingPoint.type === PricingPointType.AUTOMATIC ? pricingPoint.automaticType : null,
      orderTypes: (pricingPoint.type === PricingPointType.AUTOMATIC && pricingPoint.automaticType === AutomaticType.ORDER_TYPE) ? pricingPoint.orderTypes : [],
      applicationTypes: (pricingPoint.type === PricingPointType.AUTOMATIC && pricingPoint.automaticType === AutomaticType.APP) ? pricingPoint.applicationTypes : [],
    }

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/pricing-point/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pricing-point/new`)
        }
      })
    }
  };

  const formatPricingPointType = (type: PricingPointType) => {
    switch (type) {
      case PricingPointType.AUTOMATIC:
        return "Automatic";
      case PricingPointType.USER_SELECTED:
        return "User Selected";
      default:
        return type;
    }
  };

  const formatPricingPointAutomaticType = (automaticType: AutomaticType) => {
    switch (automaticType) {
      case AutomaticType.ORDER_TYPE:
        return "Order Type";
      case AutomaticType.CUSTOMER:
        return "Customer";
      case AutomaticType.APP:
        return "App";
      default:
        return automaticType;
    }
  };

  const formatPricingPointOrderType = (orderType: OrderMethod) => {
    switch (orderType) {
      case OrderMethod.DineIn:
        return "Dine In";
      case OrderMethod.PickUp:
        return "Pickup";
      case OrderMethod.WalkIn:
        return "Walk In";
      case OrderMethod.Delivery:
        return "Delivery";
      default:
        return orderType;
    }
  };

  const formatPricingPointAppType = (applicationType: ApplicationTypes) => {
    switch (applicationType) {
      case ApplicationTypes.ONLINE_ORDERING:
        return "Online Ordering";
      default:
        return applicationType;
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          {isNew ? "Create New Pricing Point" : "Edit Pricing Point"}
        </h2>

        {loading ? (
          <p className="text-xs">Loading...</p>
        ) : (
          <form  className="space-y-4">
            <div className="bg-white p-4 rounded-md border space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="pricing-point-name" className="text-xs font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pricing-point-name"
                    required
                    value={pricingPoint.name || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="pricing-point-branches" className="text-xs font-semibold">
                    Applicable branches
                  </Label>
                  <ReactSelect
                    inputId="pricing-point-branches"
                    value={pricingPoint.applicableBranches || []}
                    isMulti
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    onChange={selected => dispatch(
                      changeEntityField({
                        name: "applicableBranches",
                        value: selected.map((option) => option)
                      })
                    )}
                    options={branchList}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="pricing-point-type" className="text-xs font-semibold">
                    Type
                  </Label>
                  <Select
                    value={pricingPoint.type || ''}
                    onValueChange={(value) => dispatch(changeEntityField({ name: 'type', value }))}
                  >
                    <SelectTrigger id="pricing-point-type" className="h-7 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PricingPointType).map(type => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {formatPricingPointType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {pricingPoint.type === PricingPointType.AUTOMATIC && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="pricing-point-automatic-type" className="text-xs font-semibold">
                      Automatic Type
                    </Label>
                    <Select
                      value={pricingPoint.automaticType || ''}
                      onValueChange={(value) => dispatch(changeEntityField({ name: 'automaticType', value }))}
                    >
                      <SelectTrigger id="pricing-point-automatic-type" className="h-7 text-xs">
                        <SelectValue placeholder="Select automatic type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AutomaticType).map(type => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {formatPricingPointAutomaticType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {pricingPoint.automaticType === AutomaticType.ORDER_TYPE && pricingPoint.type === PricingPointType.AUTOMATIC && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="pricing-point-order-types" className="text-xs font-semibold">
                      Order Types
                    </Label>
                    <ReactSelect
                      inputId="pricing-point-order-types"
                      options={Object.values(OrderMethod).map(type => ({
                        label: formatPricingPointOrderType(type),
                        value: type
                      }))}
                      value={(pricingPoint.orderTypes || []).map(val => ({
                        label: formatPricingPointOrderType(val),
                        value: val
                      }))}
                      onChange={(selected) => {
                        dispatch(
                          changeEntityField({
                            name: "orderTypes",
                            value: selected.map((option) => option.value)
                          })
                        )
                      }}
                      isMulti
                      className="text-xs"
                    />
                  </div>
                )}

                {pricingPoint.automaticType === AutomaticType.APP && pricingPoint.type === PricingPointType.AUTOMATIC && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="pricing-point-app-types" className="text-xs font-semibold">
                      App Types
                    </Label>
                    <ReactSelect
                      inputId="pricing-point-app-types"
                      options={Object.values(ApplicationTypes).map(type => ({
                        label: formatPricingPointAppType(type),
                        value: type
                      }))}
                      value={(pricingPoint.applicationTypes || []).map(val => ({
                        label: formatPricingPointAppType(val),
                        value: val
                      }))}
                      onChange={(selected) => {
                        dispatch(
                          changeEntityField({
                            name: "applicationTypes",
                            value: selected.map((option) => option.value)
                          })
                        )
                      }}
                      isMulti
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="pricing-point-discount-type" className="text-xs font-semibold">
                    Discount
                  </Label>
                  <Select
                    value={pricingPoint.discount?.type || NO_DISCOUNT}
                    onValueChange={value => {
                      setDiscountError(null);
                      dispatch(changeEntityField({
                        name: 'discount',
                        value: value === NO_DISCOUNT ? null : { ...pricingPoint.discount, type: value, value: pricingPoint.discount?.value },
                      }));
                    }}
                  >
                    <SelectTrigger id="pricing-point-discount-type" className="h-7 text-xs">
                      <SelectValue placeholder="No discount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DISCOUNT} className="text-xs">No discount</SelectItem>
                      <SelectItem value={DiscountType.PERCENTAGE} className="text-xs">Percentage</SelectItem>
                      <SelectItem value={DiscountType.FLAT} className="text-xs">Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used instead of this point&apos;s fixed item prices. No discount keeps those prices.
                  </p>
                </div>
                {pricingPoint.discount?.type && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="pricing-point-discount-value" className="text-xs font-semibold">
                      {pricingPoint.discount.type === DiscountType.PERCENTAGE ? 'Percent off' : 'Amount off'}
                    </Label>
                    <Input
                      id="pricing-point-discount-value"
                      type="number"
                      min={0}
                      max={pricingPoint.discount.type === DiscountType.PERCENTAGE ? 100 : undefined}
                      step="any"
                      value={pricingPoint.discount.value ?? ''}
                      onChange={e => {
                        setDiscountError(null);
                        dispatch(changeEntityField({
                          name: 'discount',
                          value: {
                            ...pricingPoint.discount,
                            value: e.target.value === '' ? null : Number(e.target.value),
                          },
                        }));
                      }}
                      className="h-7 text-xs"
                    />
                    {discountError && <p className="text-xs text-destructive">{discountError}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                type="button"
                className="h-8 text-xs"
                id="cancel-save"
                data-cy="entityCreateCancelButton"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                type="button"
                disabled={updating}
                className="h-8 text-xs"
                onClick={(e) => saveEntity(e, false)}
                id="save-entity"
                data-cy="entityCreateSaveButton"
              >
                <Save className="h-4 w-4 mr-2" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button
                onClick={(e) => saveEntity(e, true)}
                disabled={updating}
                className="h-8 text-xs"
                type="button"
              >
                <Save className="h-4 w-4 mr-2" />
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};

export default PricingPointUpdate;