import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { Trash2, Save, X, Loader2 } from 'lucide-react';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import {
  getEntity as getRetailAttribute,
  reset as resetRetailAttribute
} from './retail-attribute.reducer';
import {
  getEntities as getRetailAttributeValues,
  updateEntity as updateRetailAttributeValue,
  reset as resetRetailAttributeValues, deleteEntity,

} from './retail-attribute-values.reducer';
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import RetailAttributeAdd from "app/entities/item/retail/attributes/retail-attribute-add";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const RetailAttributeValuesUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const retailAttributeValues = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributeValue = useAppSelector(state => state.retailAttributeValue.loading);
  const updatingAttributeValue = useAppSelector(state => state.retailAttributeValue.updating);
  const updateSuccessAttributeValue = useAppSelector(state => state.retailAttributeValue.updateSuccess);
  const totalItems = useAppSelector(state => state.retailAttributeValue.totalItems);

  const retailAttributeEntity = useAppSelector(state => state.retailAttribute.entity);
  const loadingAttribute = useAppSelector(state => state.retailAttribute.loading);
  const updatingAttribute = useAppSelector(state => state.retailAttribute.updating);
  const updateSuccessAttribute = useAppSelector(state => state.retailAttribute.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  console.log(retailAttributeEntity, 'retailAttributeEntity')
  console.log(retailAttributeValues, 'retailAttributeValues')


  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    dispatch(getRetailAttribute(id));
    dispatch(getRetailAttributeValues({
      id,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    return () => {
      resetRetailAttribute()
      resetRetailAttributeValues()
    }
  }, [updateSuccessAttributeValue]);

  const handleEdit = (rowData) => {
    setEditingId(rowData.id);
    setEditingValue(rowData.name);
  };

  const handleSave = (rowData) => {
    const updatedData = { ...rowData, name: editingValue };
    dispatch(updateRetailAttributeValue(updatedData));
    setEditingId(null);
    setEditingValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const openDeleteDialog = (rowData) => {
    setItemToDelete(rowData);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      dispatch(deleteEntity(itemToDelete.id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (loadingAttribute) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">
          <Translate contentKey={'retailAttributes.update.edit.title'} interpolate={{ attribute: retailAttributeEntity?.key }}>
            {`Add New ${retailAttributeEntity?.key}`}
          </Translate>
        </h2>
      </div>

      <div className="bg-white p-4 rounded-md border space-y-4">
        <div className="w-full md:w-1/2">
          <RetailAttributeAdd type={"Attribute Value"} attributeId={retailAttributeEntity?.id} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">
              <Translate contentKey={'retailAttributes.update.edit.table.title'} interpolate={{ attribute: retailAttributeEntity?.key }}>
                {retailAttributeEntity?.key} Values
              </Translate>
            </h3>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">{translate('retailAttributes.update.edit.table.fields.name')}</TableHead>
                  <TableHead className="text-xs h-8 w-24">Actions</TableHead>
                  <TableHead className="text-xs h-8 w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAttributeValue || updatingAttributeValue ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : retailAttributeValues && retailAttributeValues.length > 0 ? (
                  retailAttributeValues.map((attributeValue) => (
                    <TableRow key={attributeValue.id}>
                      <TableCell className="text-xs py-2">
                        {editingId === attributeValue.id ? (
                          <Input
                            className="h-7 text-xs"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSave(attributeValue);
                              }
                              if (e.key === 'Escape') {
                                handleCancel();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          attributeValue.name
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-2">
                        {editingId === attributeValue.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSave(attributeValue)}
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
                            onClick={() => handleEdit(attributeValue)}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => openDeleteDialog(attributeValue)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info */}
          {totalItems > 20 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground">
                Showing {retailAttributeValues?.length || 0} of {totalItems} items
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete this attribute value? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RetailAttributeValuesUpdate;
