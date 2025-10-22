import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './item-restaurant-category.reducer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';

export const ItemRestaurantCategories = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams({ activePage: 1, itemsPerPage: ITEMS_PER_PAGE, sort: 'id', order: 'asc' }, location.search)
  );

  const categoryList = useAppSelector(state => state.restaurantCategory.entities)
  const loading = useAppSelector(state => state.restaurantCategory.loading);

  const totalItems = categoryList.length;

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  const handleSyncList = () => {
    sortEntities();
  };

  const handleCreate = () => {
    navigate('/category/restaurant-items/new')
  }

  const filteredCategories = categoryList?.filter(category =>
    !nameFilter || category.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            <Translate contentKey={"itemCategories.categories.table.title"}>Restaurant Categories</Translate>
          </h2>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSyncList}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{translate("itemCategories.categories.table.buttons.refreshList")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {translate("itemCategories.categories.table.buttons.createNewRestaurantCategory")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{translate("itemCategories.categories.table.buttons.createNewRestaurantCategory")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("itemCategories.categories.table.fields.name")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold">
                  {translate("itemCategories.categories.table.fields.profileGroups")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-32 text-center">
                  {translate("itemCategories.categories.table.fields.image")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate("itemCategories.categories.table.fields.edit")}
                </TableHead>
                <TableHead className="text-xs h-8 font-semibold w-20 text-center">
                  {translate("itemCategories.categories.table.fields.delete")}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-2">
                  <Input
                    placeholder={translate("itemCategories.categories.table.search.name")}
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="h-7 text-xs"
                  />
                </TableHead>
                <TableHead className="p-2"></TableHead>
                <TableHead className="p-2"></TableHead>
                <TableHead className="p-2"></TableHead>
                <TableHead className="p-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs p-4">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    {translate("common.loading")}
                  </TableCell>
                </TableRow>
              ) : filteredCategories && filteredCategories.length > 0 ? (
                filteredCategories.map((category, i) => {
                  const editUrl = `/category/${category.id}/restaurant-items/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                  const deleteUrl = `/category/${category.id}/restaurant-items/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                  return (
                    <TableRow key={`entity-${i}`}>
                      <TableCell className="text-xs p-2">
                        <Link to={editUrl} className="text-primary hover:underline">
                          {category.name}
                          <br />
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-1">
                            #{category?.itemsCount == null ? 0 : category?.itemsCount}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {category?.accountingGroups?.map((group, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] h-5 px-2 mr-1">
                            {group.name}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        {category.attachments?.[0]?.url && (
                          <img
                            src={category.attachments[0].url}
                            alt={category.attachments[0]?.name || 'Category'}
                            className="w-16 h-16 object-cover rounded shadow-sm mx-auto"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={editUrl}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{translate("common.edit")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-xs p-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={deleteUrl}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{translate("common.delete")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs p-4 text-muted-foreground">
                    {translate("common.noRecordsFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ItemRestaurantCategories;
