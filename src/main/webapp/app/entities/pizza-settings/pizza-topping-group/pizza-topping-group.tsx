import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Save, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, updateAllEntities } from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaToppingGroup = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [sizeList, setSizeList] = useState([]);

  const pizzaToppingGroups = useAppSelector(state => state.toppingGroup.entities);
  const loading = useAppSelector(state => state.toppingGroup.loading);
  const totalItems = useAppSelector(state => state.toppingGroup.totalItems);
  const [searchValue, setSearchValue] = useState('');

  const getAllEntities = () => {

    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };




  useEffect(() => {
    getAllEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);


  useEffect(() => {
    if(pizzaToppingGroups.length > 0){
      const sortedSizes = pizzaToppingGroups?.slice()?.sort((size1, size2) => size1.order - size2.order)
      setSizeList(sortedSizes);
    }

  }, [ pizzaToppingGroups?.length])



  const handleSyncList = () => {
    getAllEntities();
  };

  const handleSave = () => {
    const newSizesList = sizeList?.map((size, index) => ({...size, order: index}))
    dispatch(updateAllEntities(newSizesList))
  }

  const handleCreate = () => {
    navigate('/pizza-topping-group/new')
  }

  const filteredList = sizeList.filter(item =>
    item.name?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Pizza Topping Groups</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSyncList}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleCreate}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Topping Group
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="max-w-sm h-8 text-xs"
            />
          </div>

          <DraggableList
            value={filteredList}
            onChange={(e) => setSizeList(e.value)}
            dataKey="id"
            dragdrop
            showArrows
            itemTemplate={(item) => {
              const editUrl = `/pizza-topping-group/${item.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
              const deleteUrl = `/pizza-topping-group/${item.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

              return (
                <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                  <Link to={editUrl} className="text-xs hover:underline">
                    {item.name}
                  </Link>
                  <div className="flex gap-2">
                    <Link to={editUrl}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </Link>
                    <Link to={deleteUrl}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PizzaToppingGroup;
