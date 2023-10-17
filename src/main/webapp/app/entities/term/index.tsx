import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Term from './term';
import TermUpdate from './term-update';
import TermDeleteDialog from './term-delete-dialog';
import UpdateItemCategory from "app/entities/term/Item-Category/update-item-category";
import UpdateMenuCategory from "app/entities/term/Menu-Category/UpdateMenuCategory";
import DeleteItemCategoryDialog from "app/entities/term/Item-Category/delete-item-category-dialog";
import DeleteMenuCategoryDialog from "app/entities/term/Menu-Category/delete-menu-category-dialog";
import MenuCategoriesTest from "app/entities/term/Menu-Category/menu-categories";
import ItemCategoriesTest from "app/entities/term/Item-Category/item-categories";

const TermRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Term />} />


    <Route path="items" element={<ItemCategoriesTest />} />
    <Route path="items/new" element={<UpdateItemCategory />} />


    <Route path="menus" element={<MenuCategoriesTest />} />
    <Route path="menus/new" element={<UpdateMenuCategory />} />

    <Route path="new" element={<TermUpdate />} />
    <Route path=":id">


      <Route path="edit" element={<TermUpdate />} />

      <Route path="items/edit" element={<UpdateItemCategory />} />
      <Route path="items/delete" element={<DeleteItemCategoryDialog />} />

      <Route path="menus/edit" element={<UpdateMenuCategory />} />
      <Route path="menus/delete" element={<DeleteMenuCategoryDialog />} />


    </Route>
  </ErrorBoundaryRoutes>
);

export default TermRoutes;
