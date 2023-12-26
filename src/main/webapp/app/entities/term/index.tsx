import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import UpdateItemRestaurantCategory from "app/entities/term/Item-restaurant-category/update-item-restaurant-category";
import UpdateMenuCategory from "app/entities/term/Menu-Category/update-menu-category";
import DeleteItemRestaurantCategoryDialog from "app/entities/term/Item-restaurant-category/delete-item-restaurant-category-dialog";
import DeleteMenuCategoryDialog from "app/entities/term/Menu-Category/delete-menu-category-dialog";
import MenuCategoriesTest from "app/entities/term/Menu-Category/menu-categories";
import ItemCategoriesTest from "app/entities/term/Item-restaurant-category/item-restaurant-categories";

const TermRoutes = () => (
  <ErrorBoundaryRoutes>


    <Route path="items" element={<ItemCategoriesTest />} />
    <Route path="items/new" element={<UpdateItemRestaurantCategory />} />


    <Route path="menus" element={<MenuCategoriesTest />} />
    <Route path="menus/new" element={<UpdateMenuCategory />} />

    <Route path=":id">



      <Route path="items/edit" element={<UpdateItemRestaurantCategory />} />
      <Route path="items/delete" element={<DeleteItemRestaurantCategoryDialog />} />

      <Route path="menus/edit" element={<UpdateMenuCategory />} />
      <Route path="menus/delete" element={<DeleteMenuCategoryDialog />} />


    </Route>
  </ErrorBoundaryRoutes>
);

export default TermRoutes;
