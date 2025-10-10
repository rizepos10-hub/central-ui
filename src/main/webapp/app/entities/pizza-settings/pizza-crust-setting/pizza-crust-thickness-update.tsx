import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, getSortState } from "react-jhipster";
import { ArrowLeft, Save } from 'lucide-react';
import Select from "react-select";

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './pizza-crust-thickness.reducer';
import { getEntities } from "app/entities/pizza-settings/pizza-size/pizza-size.reducer";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ICrustThickness } from "app/shared/model/PIZZA/crust-thickness.model";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaCrustThicknessUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaCrustThickness, setPizzaCrustThickness] = useState<ICrustThickness>({
    name: '',
    hiddenOnSizes: [],
    pricingClass: {}
  });

  const pizzaCrustThicknessEntity = useAppSelector(state => state.pizzaCrustThickness.entity);
  const crustThicknessPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities).filter(option => option.type === 'CRUST_THICKNESS');

  const pizzaSizes = useAppSelector(state => state.pizzaSize.entities);
  const loading = useAppSelector(state => state.pizzaCrustThickness.loading);
  const updating = useAppSelector(state => state.pizzaCrustThickness.updating);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getPricingClasses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  useEffect(() => {
    if (pizzaCrustThicknessEntity) {
      setPizzaCrustThickness(pizzaCrustThicknessEntity)
    }
  }, [pizzaCrustThicknessEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaCrustThickness(prevState => ({ ...prevState, [name]: value }));
  };

  const handleHiddenChange = (selectedSizes) => {
    setPizzaCrustThickness(prevState => ({ ...prevState, hiddenOnSizes: selectedSizes }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...pizzaCrustThickness,
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
            navigate(`/pizza-crust-thickness/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-crust-thickness/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{isNew ? "Add New Crust Thickness" : "Edit Crust Thickness"}</h2>
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
                    <Label htmlFor="pizza-curstThickness-name" className="text-xs">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-curstThickness-name"
                      value={pizzaCrustThickness.name || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-curstThickness-hiddenOn" className="text-xs">Hidden On</Label>
                    <Select
                      options={pizzaSizes}
                      isMulti
                      getOptionValue={option => option.id}
                      getOptionLabel={option => option.name}
                      id="pizza-curstThickness-hiddenOn"
                      value={pizzaCrustThickness?.hiddenOnSizes || []}
                      onChange={handleHiddenChange}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '32px',
                          fontSize: '0.75rem'
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: '0 8px'
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0
                        })
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-curstThickness-pricingClass" className="text-xs">
                      Pricing Class
                    </Label>
                    <Select
                      value={pizzaCrustThickness?.pricingClass || null}
                      required
                      options={crustThicknessPricingClasses}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(toppingPriceOption) => setPizzaCrustThickness((prevState) => ({ ...prevState, pricingClass: toppingPriceOption }))}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '32px',
                          fontSize: '0.75rem'
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: '0 8px'
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0
                        })
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={pizzaCrustThickness?.chosenByDefault}
                      onCheckedChange={(checked) => setPizzaCrustThickness((prev) =>
                        ({ ...prev, chosenByDefault: checked === true }))}
                    />
                    <Label className="text-xs">
                      Chosen By Default
                    </Label>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="submit"
                    disabled={updating}
                    className="h-8 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    onClick={(e) => saveEntity(e, true)}
                    id="save-entity-new"
                    data-cy="entityCreateSaveButton"
                    type="submit"
                    disabled={updating}
                    className="h-8 text-xs"
                  >
                    <Save className="h-3 w-3" />
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

export default PizzaCrustThicknessUpdate;
