import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterEntities } from "app/entities/brand/brand.reducer";
import ImageDisplay from "app/shared/components/image/image-display";
import { translate } from "react-jhipster";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';



const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: 'contains' },
  }
};


export const Brand = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const brandList = useAppSelector(state => state.brand.entities);
  const loading = useAppSelector(state => state.brand.loading);
  const totalItems = useAppSelector(state => state.brand.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get("query")) || initialState;

  const [nameFilter, setNameFilter] = useState('');




  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      filterEntities({
        query: updatedQuery,
      })
    );
  };

  const handleSyncList = () => {
    getAllEntities();
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam]);




  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const onFilter = (event: any) => {
    event['first'] = 0;
    event['page'] = 0;
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true});
  }

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({query: queryParams}, {replace: true})
  };

  const handleCreate = () => {
    navigate('/brand/new')
  }

  const handleFilterChange = (value: string) => {
    setNameFilter(value);
    const newQuery = {
      ...query,
      first: 0,
      page: 0,
      filters: {
        ...query.filters,
        name: { value: value || null, matchMode: 'contains' }
      }
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({query: queryParams}, {replace: true});
  };






  // Filter brands based on name filter
  const filteredBrands = brandList.filter(brand =>
    !nameFilter || brand.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  return (
    <PageWrapper>
      <Card>
        <CardHeader className="p-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {translate("tempApp.brands")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncList}
                disabled={loading}
                className="h-8 text-xs"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                {translate("common.refreshList")}
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={loading}
                className="h-8 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                {translate("tempApp.createNewBrand")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {/* Filter */}
          <div className="mb-2">
            <Input
              placeholder={translate("common.search.name")}
              value={nameFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="h-8 px-2 text-xs">
                    {translate("common.name")}
                  </TableHead>
                  <TableHead className="h-8 px-2 text-xs">
                    {translate("common.image")}
                  </TableHead>
                  <TableHead className="h-8 px-2 text-xs w-20">
                    {translate("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands?.length ? (
                  filteredBrands.map((brand) => (
                    <TableRow key={brand.id} className="h-10">
                      <TableCell className="px-2 py-1">
                        <Link
                          to={`/brand/${brand.id}/edit`}
                          className="text-primary hover:underline font-medium text-xs"
                        >
                          {brand.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <ImageDisplay
                          imageType={'product'}
                          imageUrl={brand?.logo?.url}
                          height={40}
                          width={40}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <Link to={`/brand/${brand.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </Link>
                          <Link to={`/brand/${brand.id}/delete`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center text-xs">
                      {translate("entity.noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-muted-foreground">
              {translate("common.showing")} {query.first + 1} {translate("common.to")} {Math.min(query.first + query.rows, totalItems)} {translate("common.of")} {totalItems} {translate("common.results")}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default Brand;
