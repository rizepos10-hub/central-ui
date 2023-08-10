import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Term from './term';
import TermDetail from './term-detail';
import TermUpdate from './term-update';
import TermDeleteDialog from './term-delete-dialog';
import ItemCategories from "app/entities/term/Item-Category/ItemCategories";
import UpdateItemCategory from "app/entities/term/Item-Category/UpdateItemCategory";
import UpdateMenuCategory from "app/entities/term/Menu-Category/UpdateMenuCategory";
import MenuCategories from "app/entities/term/Menu-Category/MenuCategories";
import DeleteITemDialog from "app/entities/term/Item-Category/DeleteItemDialog";
import DeleteMenusDialog from "app/entities/term/Menu-Category/DeleteMenusDialog";
import MenuCategoriesTest from "app/entities/term/Menu-Category/MenuCategoriesTest";
import ItemCategoriesTest from "app/entities/term/Item-Category/ItemCategoriesTest";

const TermRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Term />} />


    <Route path="items" element={<ItemCategoriesTest />} />
    <Route path="items/new" element={<UpdateItemCategory />} />


    <Route path="menus" element={<MenuCategoriesTest />} />
    <Route path="menus/new" element={<UpdateMenuCategory />} />

    <Route path="new" element={<TermUpdate />} />
    <Route path=":id">

      <Route index element={<TermDetail />} />

      <Route path="edit" element={<TermUpdate />} />


      <Route path="items/edit" element={<UpdateItemCategory />} />
      <Route path="items/delete" element={<DeleteITemDialog />} />

      <Route path="menus/edit" element={<UpdateMenuCategory />} />
      <Route path="menus/delete" element={<DeleteMenusDialog />} />


    </Route>
  </ErrorBoundaryRoutes>
);

export default TermRoutes;
