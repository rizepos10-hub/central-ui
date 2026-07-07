import React, { useState } from 'react';
import { Translate } from 'react-jhipster';
import { filterEntities } from 'app/entities/item/retail/product/product.reducer';
import { applyMatchModeMap } from './util/filter-match-model-util';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { FilterMatchMode } from 'primereact/api';
import { useAppDispatch } from 'app/config/store';
import AsyncSelect from 'app/shared/components/select/async-select';
import { IIngredient } from './model/ingredient';
import { ISimpleItemVariant } from './model/ITEM/retail/simple-item.model';
import { IItem } from './model/ITEM/item.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

function getIngredientLabel(ingredient: IIngredient): string {
  const itemName = ingredient.item?.name ?? '—';
  const variant = ingredient.item?.variants?.find(v => v.id === ingredient.variantId);
  return variant?.name ? `(${itemName}) ${variant.name}` : itemName;
}

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

      const flattedData = data?.flatMap(item =>
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

  return (
    <div className="border rounded-md p-3 space-y-3">
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

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <Translate contentKey={'common.name'}>Name</Translate>
              </TableHead>
              <TableHead className="text-xs w-28">
                <Translate contentKey={'common.quantity'}>Quantity</Translate>
              </TableHead>
              <TableHead className="text-xs w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients?.length > 0 ? (
              ingredients.map((ingredient, index) => (
                <TableRow key={ingredient.variantId ?? index}>
                  <TableCell className="text-xs">{getIngredientLabel(ingredient)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={ingredient.quantity}
                      onChange={e => {
                        updateIngredientQuantity(ingredient, parseFloat(e.target.value) ?? 1);
                      }}
                      min={1}
                      step={1}
                      className="h-7 text-xs w-20"
                    />
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-xs text-muted-foreground text-center py-4">
                  No ingredients added yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IngredientsPicker;
