import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities, reset } from './pizza-pricing-class.reducer';
import { IPizzaPricingClass } from "app/shared/model/PIZZA/pizza-pricing-class.model";
import { PizzaPricingClassType } from "app/shared/model/ENUMS/pizza-pricing-class-type.model";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const tabItems = Object.keys(PizzaPricingClassType).map(priceType => ({ label: priceType, value: PizzaPricingClassType[priceType] }));
const reverseMapping: { [key: string]: string } = {};
Object.keys(PizzaPricingClassType).forEach((key) => {
  const value = PizzaPricingClassType[key];
  reverseMapping[value] = key;
});

const PizzaPricingClass = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const pizzaPriceClassType: any = urlSearchParams.get("type");

  const [selectedType, setSelectedType] = useState({
    label: 'Crust Type',
    value: 'CRUST_TYPE'
  });
  const pizzaPricingClassList: IPizzaPricingClass[] = useAppSelector(state => state.pizzaPricingClass.entities);

  const filteredPizzaPricingClassList = useMemo(() => {
    return pizzaPricingClassList.filter(priceClass => priceClass.type === selectedType?.value);
  }, [pizzaPricingClassList?.length, selectedType?.value]);

  const loading = useAppSelector(state => state.pizzaPricingClass.loading);
  const updateSuccess = useAppSelector(state => state.pizzaPricingClass.updateSuccess);
  const totalItems = useAppSelector(state => state.pizzaPricingClass.totalItems);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = tabItems.findIndex(item => { return item.value === selectedType.value });
    return selectedIndex >= 0 ? selectedIndex : 0;
  });

  const [nameFilter, setNameFilter] = useState('');

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

    return () => {
      reset()
    }
  }, [paginationState.activePage, paginationState.order, paginationState.sort, updateSuccess]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate(`/pizza-pricing-class/new?type=${selectedType?.value}`)
  }

  const filteredList = filteredPizzaPricingClassList.filter(priceClass =>
    priceClass.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Pizza Pricing Class</h2>
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
                Add New {selectedType?.label} Price
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={selectedType.value} onValueChange={(value) => {
            const item = tabItems.find(t => t.value === value);
            if (item) {
              setSelectedType(item);
              const index = tabItems.findIndex(t => t.value === value);
              setActiveIndex(index);
            }
          }}>
            <TabsList className="w-full justify-start mb-4">
              {tabItems.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="text-xs h-7">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mb-4">
              <Input
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="max-w-sm h-8 text-xs"
              />
            </div>

            {tabItems.map((item) => (
              <TabsContent key={item.value} value={item.value}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.map((priceClass) => {
                      const editUrl = `/pizza-pricing-class/${priceClass.id}/edit?type=${selectedType?.value}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
                      const deleteUrl = `/pizza-pricing-class/${priceClass.id}/delete?type=${selectedType?.value}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

                      return (
                        <TableRow key={priceClass.id}>
                          <TableCell className="text-xs">
                            <Link to={editUrl} className="hover:underline">
                              {priceClass.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs">
                            {reverseMapping[priceClass.type]}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Link to={editUrl}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </Link>
                              <Link to={deleteUrl}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PizzaPricingClass;
