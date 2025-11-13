import React, { useState } from 'react';
import { Translate } from 'react-jhipster';
import Select from 'react-select/dist/declarations/src/Select';
import { filterEntities } from 'app/entities/item/retail/product/product.reducer';
import { applyMatchModeMap } from './util/filter-match-model-util';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch } from 'app/config/store';
import AsyncSelect from 'react-select/async';
import { IIngredient } from './model/ingredient';
import { ISimpleItemVariant } from './model/ITEM/retail/simple-item.model';
import { IItem } from './model/ITEM/item.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

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
    <div className="space-y-3">
      <Label htmlFor="ingredients" className="text-xs font-semibold">
        <Translate contentKey={'common.ingredients'}>ingredients</Translate>
      </Label>
      <div className="flex gap-2">
        <AsyncSelect
          value={selectedItemWithVariant}
          defaultOptions
          getOptionLabel={option => `(${option?.item?.name}) ${option?.variant?.name}`}
          getOptionValue={option => option?.variant?.id}
          loadOptions={loadVariantOptions}
          className="flex-1"
          cacheOptions
          onChange={setSelectedItemWithVariant}
          placeholder="Search to add a product"
        />
        <Input
          type="number"
          value={quantity}
          onChange={e => {
            setQuantity(parseFloat(e.target.value) ?? 1);
          }}
          min={1}
          step={1}
          className="w-24 h-8 text-xs"
        />
        <Button
          type="button"
          onClick={addIngredient}
          size="sm"
          className="h-8 text-xs"
        >
          <Translate contentKey={'common.add'}>Add</Translate>
        </Button>
      </div>
      <div className="space-y-2">
        {ingredients?.map((ingredient, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7 text-xs">{ingredient.item?.name}</div>
            <div className="col-span-3">
              <Input
                type="number"
                value={ingredient.quantity}
                onChange={e => {
                  updateIngredientQuantity(ingredient, parseFloat(e.target.value) ?? 1);
                }}
                min={1}
                step={1}
                className="h-7 text-xs"
              />
            </div>
            <div className="col-span-2">
              <Button
                variant="destructive"
                type="button"
                onClick={() => removeIngredient(ingredient)}
                size="sm"
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                <Translate contentKey={'common.remove'}>Remove</Translate>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IngredientsPicker;
