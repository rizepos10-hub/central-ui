import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import UpdateItemRestaurantCategory from "app/entities/term/restaurant-Item-category/update-item-restaurant-category";
import UpdateMenuCategory from "app/entities/term/Menu-Category/update-menu-category";
import DeleteItemRestaurantCategoryDialog from "app/entities/term/restaurant-Item-category/delete-item-restaurant-category-dialog";
import DeleteMenuCategoryDialog from "app/entities/term/Menu-Category/delete-menu-category-dialog";
import MenuCategories from "app/entities/term/Menu-Category/menu-categories";
import RestaurantItemCategory from "app/entities/term/restaurant-Item-category/item-restaurant-categories";

import RetailItemCategory from "app/entities/term/retail-item-category/retail-item-categories"
import UpdateRetailItemCategory from "app/entities/term/retail-item-category/update-retail-item-category";
import DeleteRetailItemCategoryDialog from "app/entities/term/retail-item-category/delete-retail-item-category-dialog";

const TermRoutes = () => (
  <ErrorBoundaryRoutes>


    <Route path="restaurant-items" element={<RestaurantItemCategory />} />
    <Route path="restaurant-items/new" element={<UpdateItemRestaurantCategory />} />


    <Route path="retail-items" element={<RetailItemCategory />} />
    <Route path="retail-items/new" element={<UpdateRetailItemCategory />} />


    <Route path="menus" element={<MenuCategories />} />
    <Route path="menus/new" element={<UpdateMenuCategory />} />

    <Route path=":id">

      {/* restaurant Item category edit or delete */}
      <Route path="restaurant-items/edit" element={<UpdateItemRestaurantCategory />} />
      <Route path="restaurant-items/delete" element={<DeleteItemRestaurantCategoryDialog />} />

      {/* restaurant Item category edit or delete */}
      <Route path="retail-items/edit" element={<UpdateRetailItemCategory />} />
      <Route path="retail-items/delete" element={<DeleteRetailItemCategoryDialog />} />

      {/* menu  category edit or delete */}
      <Route path="menus/edit" element={<UpdateMenuCategory />} />
      <Route path="menus/delete" element={<DeleteMenuCategoryDialog />} />


    </Route>
  </ErrorBoundaryRoutes>
);

export default TermRoutes;
