import React from 'react';
import { getEntities, updateEntity } from './item-restaurant-category.reducer';
import UpdateItemRestaurantCategoryTree from './update-item-restaurant-category-tree';
import DynamicCategoryTree from '../category-tree';

export const ItemRestaurantCategoriesTree = () => {
  return (
    <DynamicCategoryTree
      selector={(state) => state.restaurantCategory.entities}
      loadingSelector={(state) => state.restaurantCategory.loading}
      getEntities={getEntities}
      updateEntity={updateEntity}
      UpdateComponent={UpdateItemRestaurantCategoryTree}
    />
  );
};

export default ItemRestaurantCategoriesTree;
