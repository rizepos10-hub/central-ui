import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getSortState, translate, Translate, } from 'react-jhipster';
import { Eye, Trash2, Save, X, ArrowUpDown } from 'lucide-react';

import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, updateEntity } from './retail-attribute.reducer';
import { FilterMatchMode } from "primereact/api";
import RetailAttributeAdd from "app/entities/item/retail/attributes/retail-attribute-add";
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const initialState = {
  first: 0,
  rows: 20,
  page: 0,
  sortField: null,
  sortOrder: null,
  query: '',
  filters: {
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  },
};

export const RetailAttributes = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();

  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  const retailAttributeList = useAppSelector(state => state.retailAttribute.entities);
  const loading = useAppSelector(state => state.retailAttribute.loading);
  const updating = useAppSelector(state => state.retailAttribute.updating);
  const updateSuccess = useAppSelector(state => state.retailAttribute.updateSuccess);
  const totalItems = useAppSelector(state => state.retailAttribute.totalItems);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>(query.filters?.name?.value || '');
  const [sortField, setSortField] = useState<string | null>(query.sortField);
  const [sortOrder, setSortOrder] = useState<number | null>(query.sortOrder);
  const [currentPage, setCurrentPage] = useState<number>(query.page || 0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(query.rows || 20);

  const getAllEntities = () => {
    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [searchParam, updateSuccess]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newQuery = {
        ...query,
        filters: {
          ...query.filters,
          name: { value: nameFilter || null, matchMode: FilterMatchMode.CONTAINS }
        },
        first: 0,
        page: 0
      };
      const queryParams = JSON.stringify(newQuery);
      setSearchParams({ query: queryParams }, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  const handleEdit = (rowData) => {
    setEditingId(rowData.id);
    setEditingValue(rowData.name);
  };

  const handleSave = (rowData) => {
    const updatedData = { ...rowData, name: editingValue };
    dispatch(updateEntity(updatedData));
    setEditingId(null);
    setEditingValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleSort = (field: string) => {
    let newSortOrder = 1;
    if (sortField === field) {
      newSortOrder = sortOrder === 1 ? -1 : sortOrder === -1 ? null : 1;
    }

    setSortField(newSortOrder === null ? null : field);
    setSortOrder(newSortOrder);

    const newQuery = {
      ...query,
      sortField: newSortOrder === null ? null : field,
      sortOrder: newSortOrder
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const newQuery = {
      ...query,
      page: newPage,
      first: newPage * rowsPerPage
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const handleRowsPerPageChange = (newRows: number) => {
    setRowsPerPage(newRows);
    const newQuery = {
      ...query,
      rows: newRows,
      page: 0,
      first: 0
    };
    const queryParams = JSON.stringify(newQuery);
    setSearchParams({ query: queryParams }, { replace: true });
  };

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = currentPage * rowsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * rowsPerPage, totalItems);

  return (
    <PageWrapper>
      <div className="w-full md:w-1/2">
        <RetailAttributeAdd type={"Attribute"} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            <Translate contentKey={'retailAttributes.view.table.title'}>Retail Attributes</Translate>
          </h2>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">
                  <div className="flex items-center gap-1">
                    <span>{translate('retailAttributes.view.table.fields.name')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => handleSort('name')}
                    >
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="text-xs h-8 w-24">{translate('retailAttributes.view.table.fields.configure')}</TableHead>
                <TableHead className="text-xs h-8 w-20">{translate('retailAttributes.view.table.fields.view')}</TableHead>
                <TableHead className="text-xs h-8 w-20">{translate('retailAttributes.view.table.fields.delete')}</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="h-8 p-2">
                  <Input
                    className="h-7 text-xs"
                    placeholder={translate('retailAttributes.view.table.search.name')}
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </TableHead>
                <TableHead className="h-8" />
                <TableHead className="h-8" />
                <TableHead className="h-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || updating ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : retailAttributeList && retailAttributeList.length > 0 ? (
                retailAttributeList.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell className="text-xs py-2">
                      {editingId === attribute.id ? (
                        <Input
                          className="h-7 text-xs"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSave(attribute);
                            }
                            if (e.key === 'Escape') {
                              handleCancel();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        attribute.name
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      {editingId === attribute.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleSave(attribute)}
                          >
                            <Save className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleCancel}
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleEdit(attribute)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      <Link to={`/retail/attributes/${attribute.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3 text-gray-400" />
                        </Button>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      <Link to={`/retail/attributes/${attribute.id}/delete`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-xs text-center py-4">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page:</span>
            <select
              className="h-7 text-xs border rounded px-2"
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50, 100, 200].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {startItem}-{endItem} of {totalItems}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
              >
                &lt;&lt;
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                &gt;
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
              >
                &gt;&gt;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default RetailAttributes;
