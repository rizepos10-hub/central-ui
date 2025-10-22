import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import { RefreshCw, Plus, Pencil } from 'lucide-react';

import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities, resetEntity } from "./tax.reducer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import AddTaxModal from "app/entities/settings/tax/add-tax-modal";
import { ITax } from "app/shared/model/TAX/tax.model";

export const Tax = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const taxList :ITax[] = useAppSelector(state => state.tax.entities);
  const loading = useAppSelector(state => state.tax.loading);
  const totalItems = useAppSelector(state => state.tax.totalItems);


  const [isModalVisible, setModalVisible] = useState(false)

  const [selectedTaxId, setSelectedTaxId] = useState(null);


  const handleCreate = () => {
    setSelectedTaxId(null);
    dispatch(resetEntity());
    setModalVisible(true);
  };



  const handleEdit = (id) => {
    setModalVisible(true);
    setSelectedTaxId(id);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };


  const [filters, setFilters] = useState({
    code: '',
    description: '',
    value: '',
  });


  const getTaxes = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  };

  useEffect(() => {
    getTaxes();
  }, []);


  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredTaxList = taxList.filter((tax) => {
    const matchCode = !filters.code || tax.code?.toLowerCase().includes(filters.code.toLowerCase());
    const matchDescription = !filters.description || tax.description?.toLowerCase().includes(filters.description.toLowerCase());
    const matchValue = !filters.value || tax.value?.toString().includes(filters.value);
    return matchCode && matchDescription && matchValue;
  });

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-xs">Taxes</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={getTaxes}
              disabled={loading}
              className="h-7 text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-7 text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create new Tax
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Code</div>
                    <Input
                      placeholder="Search by Code"
                      value={filters.code || ''}
                      onChange={(e) => handleFilterChange('code', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="h-8">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold">Value</div>
                    <Input
                      placeholder="Search by value"
                      value={filters.value || ''}
                      onChange={(e) => handleFilterChange('value', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="h-8 text-xs font-semibold">Description</TableHead>
                <TableHead className="h-8 w-16 text-xs font-semibold">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaxList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                    No taxes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxList.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell className="text-xs">
                      <Link
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(tax.id);
                        }}
                        className="text-primary hover:underline"
                      >
                        {tax.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{tax.value}</TableCell>
                    <TableCell className="text-xs">{tax.description}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(tax.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {isModalVisible && <AddTaxModal visible={isModalVisible} onHide={handleCloseModal} taxId={selectedTaxId} />}
      </div>
    </PageWrapper>
  );
};

export default Tax;
