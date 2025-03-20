import React from 'react';
import { getEntities, updateEntity } from './retail-item-category.reducer';
import { UpdateItemRetailCategoryTree } from './update-retail-item-category-tree';
import DynamicCategoryTree from '../category-tree';

export const RetailItemCategoryTree = () => {
    return (
        <DynamicCategoryTree
            selector={(state) => state.retailCategory.entities}
            loadingSelector={(state) => state.retailCategory.loading}
            getEntities={getEntities}
            updateEntity={updateEntity}
            UpdateComponent={UpdateItemRetailCategoryTree}
        />
    );
};

export default RetailItemCategoryTree;
