import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-topping.reducer';

import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ITopping } from "app/shared/model/PIZZA/topping.model";
import CreatableSelect from "react-select/creatable";
import { getEntities as getToppingGroups, createEntity as createToppingGroup } from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer";
import Select from 'app/shared/components/select/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaToppingUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaTopping, setPizzaTopping] = useState<ITopping>({
    name: '',
    group: {
      id: "",
      name: ""
    },
    pricingClass: {}
  });
  const toppingPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities).filter(option => option.type === 'TOPPING');

  const pizzaToppingGroups = useAppSelector(state => state.toppingGroup.entities).map(tpngGrp => ({ ...tpngGrp, label: tpngGrp.name, value: tpngGrp.id }));
  const updatingGroup = useAppSelector(state => state.toppingGroup.updating);


  const pizzaToppingEntity = useAppSelector(state => state.pizzaTopping.entity);
  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const updating = useAppSelector(state => state.pizzaTopping.updating);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getToppingGroups({
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
    if (pizzaToppingEntity) {
      setPizzaTopping(() => {
        const toppingGroup = { ...pizzaToppingEntity.group };
        const modifiedGroup = { ...toppingGroup, label: toppingGroup.name, value: toppingGroup?.id };
        return {
          ...pizzaToppingEntity,
          group: modifiedGroup
        }
      })
    }
  }, [pizzaToppingEntity?.name]);

  const handleChange = (name, value) => {
    setPizzaTopping(prevState => ({ ...prevState, [name]: value }));
  };

  const handleGroupChange = (selectedGroup) => {
    const selectedToppingGroup = selectedGroup ? selectedGroup : null
    setPizzaTopping((prev) => ({ ...prev, group: selectedToppingGroup }))
  }

  const handleAddImage = (imageType, imageInfo) => {
    setPizzaTopping((prevState) => ({ ...prevState, [imageType]: transformAttachmentStructure(imageInfo, 'toIAttachment')[0] }))
  }

  const handleRemoveImage = (imageType) => {
    setPizzaTopping((prevState) => ({ ...prevState, [imageType]: null }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...pizzaTopping,
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
            navigate(`/pizza-topping/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-topping/new`)
        }
      })
    }
  };



  const handleCreate = (inputValue: string) => {
    const entity = {
      name: inputValue
    };
    dispatch(createToppingGroup(entity));
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{isNew ? "Add New Topping" : "Edit Topping"}</h2>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-topping-name" className="text-xs">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-topping-name"
                      value={pizzaTopping.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-topping-group" className="text-xs">Topping Group</Label>
                    <CreatableSelect
                      isDisabled={updatingGroup}
                      isLoading={updatingGroup}
                      options={pizzaToppingGroups}
                      value={pizzaTopping.group || null}
                      onCreateOption={handleCreate}
                      onChange={handleGroupChange}
                      isClearable={true}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-topping-weight" className="text-xs">Weight</Label>
                    <Input
                      type="number"
                      name="weight"
                      required={true}
                      id="pizza-topping-weight"
                      value={pizzaTopping.weight || ''}
                      onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Pricing Class</Label>
                    <Select
                      value={pizzaTopping?.pricingClass || null}
                      required
                      options={toppingPricingClasses}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(toppingPriceOption) => setPizzaTopping((prevState) => ({ ...prevState, pricingClass: toppingPriceOption }))}
                    />
                  </div>


                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Topping Image</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={(files) => handleAddImage("image", files)}
                      defaultValues={transformAttachmentStructure(pizzaTopping?.image ? [pizzaTopping?.image] : [], 'toFileLibraryListItem')}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Topping Icon</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={(files) => handleAddImage("icon", files)}
                      defaultValues={transformAttachmentStructure(pizzaTopping?.icon ? [pizzaTopping?.icon] : [], 'toFileLibraryListItem')}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate(-1)}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={saveEntity}
                    type="button"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => saveEntity(e, true)}
                    type="button"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-1" />
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

export default PizzaToppingUpdate;
