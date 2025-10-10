import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-predefined.reducer';

import { getEntities as getToppings } from "app/entities/pizza-settings/pizza-topping/pizza-topping.reducer";

import { IPredefinedPizza } from "app/shared/model/PIZZA/predefined-pizza.model";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PredefinedPizzaUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [predefinedPizza, setPredefinedPizza] = useState<IPredefinedPizza>({
    name: '',
    toppings: []
  });
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const predefinedPizzaEntity = useAppSelector(state => state.predefinedPizza.entity);
  const loading = useAppSelector(state => state.predefinedPizza.loading);
  const updating = useAppSelector(state => state.predefinedPizza.updating);
  const pizzaToppingList = useAppSelector(state => state.pizzaTopping.entities);


  console.log(pizzaToppingList, 'pizzaToppingList')
  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getToppings({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  }, []);

  useEffect(() => {
    if (predefinedPizzaEntity) {
      setPredefinedPizza(predefinedPizzaEntity)
    }
  }, [predefinedPizzaEntity?.name, pizzaToppingList[0]?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPredefinedPizza(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOptionChange = (selectedOptions) => {
    console.log(selectedOptions, 'selectedOptions')
    setPredefinedPizza((prevState => ({ ...prevState, toppings: selectedOptions })))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...predefinedPizza,
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
            navigate(`/predefined-pizza/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/predefined-pizza/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{isNew ? "Add New Predefined Pizza" : "Edit Predefined Pizza"}</h2>
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
                    <Label htmlFor="predefined-pizza-name" className="text-xs">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="predefined-pizza-name"
                      value={predefinedPizza.name || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="predefined-pizza-toppings" className="text-xs">Toppings</Label>
                    <Select
                      name="toppings"
                      options={pizzaToppingList}
                      isMulti
                      getOptionLabel={(option) => option.name}
                      getOptionValue={(option => option.id)}
                      required={true}
                      id="predefined-pizza-toppings"
                      value={predefinedPizza.toppings || []}
                      onChange={handleOptionChange}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' })
                      }}
                    />
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

export default PredefinedPizzaUpdate;
