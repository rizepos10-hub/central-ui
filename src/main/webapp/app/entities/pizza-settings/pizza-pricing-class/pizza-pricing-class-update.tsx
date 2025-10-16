import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './pizza-pricing-class.reducer';
import { getEntities as getSizes } from 'app/entities/pizza-settings/pizza-size/pizza-size.reducer';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState, isNumber } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IPizzaPricingClass } from 'app/shared/model/PIZZA/pizza-pricing-class.model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaPricingClassTypeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const urlSearchParams = new URLSearchParams(window.location.search);
  const pizzaPriceClassType: any = urlSearchParams.get('type');
  const [pizzaPricingClass, setPizzaPricingClass] = useState<IPizzaPricingClass>({
    name: '',
    prices: {},
    type: '',
  });
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const pizzaPricingClassEntity = useAppSelector(state => state.pizzaPricingClass.entity);
  const loading = useAppSelector(state => state.pizzaPricingClass.loading);
  const updating = useAppSelector(state => state.pizzaPricingClass.updating);
  const pizzaSizesList = useAppSelector(state => state.pizzaSize.entities);

  const sizesMap = useMemo(() => {
    return pizzaSizesList
      ?.slice()
      ?.sort((size1, size2) => size1?.order - size2?.order)
      ?.reduce((acc, size) => {
        acc[size.id] = size;
        return acc;
      }, {});
  }, [pizzaSizesList?.length]);

  const handleClose = id => {
    navigate(`/pizza-pricing-class/${id}/edit?type=${pizzaPriceClassType}`);
  };

  console.log(sizesMap, 'sizesMap');

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      setPizzaPricingClass({
        name: '',
        prices: {},
        type: pizzaPriceClassType,
      });
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getSizes({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  useEffect(() => {
    if (!isNew) {
      const existingPrices = pizzaPricingClassEntity?.prices || {};

      const existingSizeIds = new Set(Object.keys(existingPrices));

      const missingSizeIds = pizzaSizesList.filter(size => !existingSizeIds.has(size.id)).map(size => size.id);

      const initialPricesForMissingSizes = missingSizeIds.reduce((acc, sizeId) => {
        acc[sizeId] = null;
        return acc;
      }, {});

      const updatedPrices = {
        ...existingPrices,
        ...initialPricesForMissingSizes,
      };
      setPizzaPricingClass({ ...pizzaPricingClassEntity, prices: updatedPrices });
    } else {
      const priceType = urlSearchParams.get('type');
      const initialPrices = pizzaSizesList.reduce((acc, size) => {
        acc[size.id] = null;
        return acc;
      }, {});
      setPizzaPricingClass(prevState => ({ ...prevState, type: priceType, prices: initialPrices }));
    }
  }, [pizzaSizesList?.length, pizzaPricingClassEntity]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaPricingClass(prevState => ({ ...prevState, [name]: value }));
  };

  // Add validation function to check if all prices are valid
  const isFormValid = useMemo(() => {
    // Check if name is provided
    if (!pizzaPricingClass.name?.trim()) {
      return false;
    }

    // Check if all prices are filled and valid (not null, undefined, or empty)
    const prices = pizzaPricingClass.prices || {};
    const priceValues = Object.values(prices);

    // If no prices exist, form is invalid
    if (priceValues.length === 0) {
      return false;
    }

    // Check if all prices have valid values (not null, undefined, or negative)
    return priceValues.every(price => price !== null && price !== undefined && typeof price === 'number' && price >= 0);
  }, [pizzaPricingClass.name, pizzaPricingClass.prices]);

  // Add individual field validation
  const fieldValidation = useMemo(() => {
    const isNameValid = !!pizzaPricingClass.name?.trim();
    const prices = pizzaPricingClass.prices || {};
    const priceValidation = {};

    Object.entries(prices).forEach(([sizeId, price]) => {
      priceValidation[sizeId] = {
        isValid: price !== null && price !== undefined && typeof price === 'number' && price >= 0,
        isEmpty: price === null || price === undefined,
      };
    });

    return {
      name: {
        isValid: isNameValid,
        isEmpty: !pizzaPricingClass.name?.trim(),
      },
      prices: priceValidation,
    };
  }, [pizzaPricingClass.name, pizzaPricingClass.prices]);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...pizzaPricingClass,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(res => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/pizza-pricing-class/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-pricing-class/new?type=${pizzaPriceClassType}`);
        }
      });
    }
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{isNew ? `Add New Pizza Price Class ${pizzaPriceClassType} ` : `Edit Pizza Price Class ${pizzaPricingClass.name}`}</h2>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <p className="text-xs">Loading...</p>
            ) : (
              <form>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-pricing-class-name" className="text-xs">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-pricing-class-name"
                      value={pizzaPricingClass.name || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>

                  {pizzaPricingClass?.prices &&
                    Object.entries(pizzaPricingClass.prices)
                      .sort(([sizeId1], [sizeId2]) => (sizesMap[sizeId1]?.order || 0) - (sizesMap[sizeId2]?.order || 0))
                      .map(([sizeId, value], index) => {
                        const validation = fieldValidation.prices[sizeId];
                        return (
                          <div key={index} className="flex flex-col gap-2">
                            <Label htmlFor={`${sizesMap[sizeId]?.name}`} className="text-xs">
                              {sizesMap[sizeId]?.name} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              id={sizesMap[sizeId]?.name}
                              value={value ?? ''}
                              required
                              step="0.01"
                              onChange={e => {
                                const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
                                setPizzaPricingClass(prevState => ({
                                  ...prevState,
                                  prices: {
                                    ...prevState.prices,
                                    [sizeId]: numValue,
                                  },
                                }));
                              }}
                              className="h-8 text-xs"
                            />
                          </div>
                        );
                      })}

                  {/* Summary validation message */}
                  {!isFormValid && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                      <small className="text-red-600 font-bold">Please complete all required fields:</small>
                      <ul className="mt-2 pl-5 text-red-600 list-disc">
                        {fieldValidation.name.isEmpty && (
                          <li>
                            <small>Enter a name for the pricing class</small>
                          </li>
                        )}
                        {Object.entries(fieldValidation.prices).map(([sizeId, validation]) => {
                          const validationData = validation as { isValid: boolean; isEmpty: boolean };
                          return validationData.isEmpty ? (
                            <li key={sizeId}>
                              <small>Enter a price for {sizesMap[sizeId]?.name}</small>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    onClick={() => navigate('/pizza-pricing-class')}
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating || !isFormValid}
                    className="h-8 text-xs"
                  >
                    <Save className="h-4 w-4" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    onClick={e => saveEntity(e, true)}
                    id="save-entity-new"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating || !isFormValid}
                    className="h-8 text-xs"
                  >
                    <Save className="h-4 w-4" />
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default PizzaPricingClassTypeUpdate;
