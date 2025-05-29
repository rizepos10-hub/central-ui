import React, { useState } from 'react';
import { Translate } from 'react-jhipster';
import Select from 'react-select/dist/declarations/src/Select';
import { Button, Label } from 'reactstrap';
import { filterEntities } from 'app/entities/item/retail/product/product.reducer';
import { applyMatchModeMap } from './util/filter-match-model-util';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch } from 'app/config/store';
import AsyncSelect from 'react-select/async';
import { InputNumber } from 'primereact/inputnumber';
import { IIngredient } from './model/ingredient';
import { ISimpleItemVariant } from './model/ITEM/retail/simple-item.model';
import { IItem } from './model/ITEM/item.model';

const IngredientsPicker = ({ ingredients, onChange }: { ingredients: IIngredient[]; onChange: (ingredients: IIngredient[]) => void }) => {
  const dispatch = useAppDispatch();
  const [selectedItemWithVariant, setSelectedItemWithVariant] = useState<{
    item: IItem;
    variant: ISimpleItemVariant;
  }>();

  const [quantity, setQuantity] = useState(1);

  const loadVariantOptions = async inputValue => {
    if (!inputValue) return [];

    try {
      const updatedQuery = applyMatchModeMap({
        ...initialItemFilterState,
        filters: {
          ...initialItemFilterState.filters,
          name: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
        },
      });
      const response = await dispatch(
        filterEntities({
          query: updatedQuery,
        })
      );
      const payload = response.payload as any;
      const data = payload?.data;

      // flattedData now is array of objects with variantId and name
      // we need to return array of objects with two fields: variant which holds

      const flattedData = data?.flatMap(item =>
        // filter selected variants
        item?.variants?.filter(variant => !ingredients.some(ingredient => ingredient.variantId === variant.id))?.map(variant => ({
          variant,
          item,
        }))
      );
      return flattedData;
    } catch (error) {
      console.error('Error loading options:', error);
      return [];
    }
  };

  const addIngredient = () => {
    if (selectedItemWithVariant) {
      const newIngredient = {
        item: selectedItemWithVariant.item,
        quantity,
        variantId: selectedItemWithVariant.variant.id,
      };
      
      const existingIndex = ingredients?.findIndex(
        ing => ing.variantId === newIngredient.variantId
      );
      
      let newIngredients;
      if (existingIndex !== undefined && existingIndex !== -1) {
        newIngredients = ingredients.map((ing, idx) =>
          idx === existingIndex ? { ...ing, ...newIngredient } : ing
        );
      } else {
        newIngredients = [...(ingredients || []), newIngredient];
      }
      
      onChange(newIngredients);
      setSelectedItemWithVariant(null);
      setQuantity(1);
    }
  };

  const updateIngredientQuantity = (ingredient: IIngredient, newQuantity: number) => {
    const newIngredients = ingredients.map(ing =>
      ing.variantId === ingredient.variantId ? { ...ing, quantity: newQuantity } : ing
    );
    onChange(newIngredients);
  };

  const removeIngredient = (ingredient: IIngredient) => {
    const newIngredients = ingredients.filter(ing => ing.variantId !== ingredient.variantId);
    onChange(newIngredients);
  };

  console.log(ingredients, 'ingredients');

  return (
    <div className="d-flex flex-column gap-2">
      <Label for="ingredients">
        <Translate contentKey={'common.ingredients'}>ingredients</Translate>
      </Label>
      <div className="d-flex gap-2">
        <AsyncSelect
          value={selectedItemWithVariant}
          defaultOptions
          getOptionLabel={option => `(${option?.item?.name}) ${option?.variant?.name}`}
          getOptionValue={option => option?.variant?.id}
          loadOptions={loadVariantOptions}
          className="w-100"
          cacheOptions
          onChange={setSelectedItemWithVariant}
          placeholder="Search to add a product"
        />
        <InputNumber
          value={quantity}
          onChange={e => {
            setQuantity(e.value);
          }}
        />
        <Button
          color="primary"
          type="button"
          onClick={addIngredient}
        >
          <Translate contentKey={'common.add'}>Add</Translate>
        </Button>
      </div>
      <div>
        <div className="d-flex flex-column gap-2">
          {ingredients?.map((ingredient, index) => (
            <div key={index} className="grid">
              <div className="col-8">{ingredient.item?.name}</div>
              <div className="col-3">
                <InputNumber
                  value={ingredient.quantity}
                  onChange={e => {
                    updateIngredientQuantity(ingredient, e.value);
                  }}
                />
              </div>
              <div className="col-1">
                <Button
                  color="danger"
                  type="button"
                  onClick={() => removeIngredient(ingredient)}
                >
                  <Translate contentKey={'common.remove'}>Remove</Translate>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IngredientsPicker;
