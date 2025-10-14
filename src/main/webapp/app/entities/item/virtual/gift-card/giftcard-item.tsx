import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { translate, Translate } from 'react-jhipster';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './giftcard-item.reducer';
import { SummarizeText } from "app/shared/util/SummarizeText";
import ImageDisplay from "app/shared/components/image/image-display";
import { updateTableFilters } from "app/shared/util/filter-match-model-util";
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { IGiftCardItem } from "app/shared/model/ITEM/virtual/giftcard-item.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export const GiftCardItem = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const giftCardItemsList: IGiftCardItem[] = useAppSelector(state => state.GiftCardItem.entities);
  const loading = useAppSelector(state => state.GiftCardItem.loading);
  const totalItems = useAppSelector(state => state.GiftCardItem.totalItems);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParams.get("query")) || initialItemFilterState;
  const [localFilters, setLocalFilters] = useState(query?.filters);

  const getAllEntities = () => {
    dispatch(
      getEntities({})
    );
  };

  useEffect(() => {
    getAllEntities();
    return () => {
      searchParams.set("query", "")
    }
  }, [query?.first, query?.page]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const onSort = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const onFilter = (newFilters) => {
    const newFilters1 = updateTableFilters(newFilters);
    setLocalFilters(newFilters1);
    query['first'] = 0;
    query['page'] = 0;
    query.filters = updateTableFilters({ ...localFilters });
    const queryParams = JSON.stringify(query);
    setSearchParams({ query: queryParams }, { replace: true });
    getAllEntities();
  };

  const onPage = (event) => {
    const queryParams = JSON.stringify(event);
    setSearchParams({ query: queryParams }, { replace: true })
  };

  const handleFilterValueChange = useCallback((field, value) => {
    const updatedFilters = {
      ...localFilters,
      [field]: value
    };

    const cleanedFilters = updateTableFilters(updatedFilters);
    setLocalFilters(cleanedFilters)
  }, [query.filters, localFilters]);

  const handleClear = () => {
    setLocalFilters({});
    const newQuery = JSON.stringify({
      ...query,
      filters: {}
    });
    setSearchParams({ query: newQuery }, { replace: true });
  };

  const handleCreate = () => {
    navigate('/gift-cards/new')
  }

  // Filter data client-side based on localFilters
  const filteredData = giftCardItemsList.filter(item => {
    if (!localFilters) return true;

    let matches = true;
    if (localFilters.name && typeof localFilters.name === 'string' && item.name) {
      matches = matches && item.name.toLowerCase().includes(localFilters.name.toLowerCase());
    }
    if (localFilters.tags && typeof localFilters.tags === 'string' && item.tags) {
      const tagsString = item.tags.map(tag => tag?.name).join(' ');
      matches = matches && tagsString.toLowerCase().includes(localFilters.tags.toLowerCase());
    }
    if (localFilters.desc && typeof localFilters.desc === 'string' && item.desc) {
      matches = matches && item.desc.toLowerCase().includes(localFilters.desc.toLowerCase());
    }
    return matches;
  });

  return (
    <PageWrapper>
      <Card>
        <CardContent>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">
              <Translate contentKey={'items.view.titles.tableTitle.giftcard'}>Gift Card Items</Translate>
            </h2>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncList}
                      disabled={loading}
                      className="h-7 w-7 p-0"
                    >
                      {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{translate('items.view.actions.refreshList')}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={loading}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{translate('items.view.actions.createGiftCard')}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {/* Header Row */}
                <TableRow className="h-8">
                  <TableHead className="h-8 px-2 text-xs">{translate('items.view.fields.name')}</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Tag</TableHead>
                  <TableHead className="h-8 px-2 text-xs">{translate('items.view.fields.image')}</TableHead>
                  <TableHead className="h-8 px-2 text-xs">{translate('items.view.fields.description')}</TableHead>
                  <TableHead className="h-8 px-2 text-xs text-center w-12">{translate('items.view.fields.edit')}</TableHead>
                  <TableHead className="h-8 px-2 text-xs text-center w-12">{translate('items.view.fields.delete')}</TableHead>
                </TableRow>
                {/* Filter Row */}
                <TableRow className="h-8">
                  <TableHead className="h-8 px-2">
                    <Input
                      placeholder={translate('items.view.filters.name')}
                      value={localFilters?.name || ''}
                      onChange={(e) => handleFilterValueChange('name', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="h-8 px-2">
                    <Input
                      placeholder="Filter tags..."
                      value={localFilters?.tags || ''}
                      onChange={(e) => handleFilterValueChange('tags', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="h-8 px-2"></TableHead>
                  <TableHead className="h-8 px-2">
                    <Input
                      placeholder="Filter description..."
                      value={localFilters?.desc || ''}
                      onChange={(e) => handleFilterValueChange('desc', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </TableHead>
                  <TableHead className="h-8 px-2 text-center">
                    {Object.keys(localFilters || {}).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-6 text-xs px-2"
                      >
                        Clear
                      </Button>
                    )}
                  </TableHead>
                  <TableHead className="h-8 px-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredData?.length ? (
                  filteredData.map(item => (
                    <TableRow key={item.id} className="h-10">
                      <TableCell className="px-2 py-1 text-xs">
                        <Link
                          to={`/gift-cards/${item.id}/edit`}
                          className="text-primary hover:underline font-medium"
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        {item?.tags?.map(cat => cat?.name).join(' | ')}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <ImageDisplay
                          imageType={'product'}
                          imageUrl={item?.attachments?.[0]?.url || item?.variants?.[0]?.attachments?.[0]?.url}
                          height={40}
                          width={40}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        <SummarizeText>{item.desc}</SummarizeText>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center w-12">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/gift-cards/${item.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center w-12">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/gift-cards/${item.id}/delete`}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center text-xs">
                      <Translate contentKey="entity.noResults" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default GiftCardItem;
