import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ButtonGroup } from '@/components/ui/button-group';

import { getEntity, createEntity, reset, updateEntity } from './supplier-return.reducer';
import { IReturnLine, ISupplierReturn } from 'app/shared/model/STOCK/supplier-return.model';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getPurchaseOrders, reset as resetPO, getEntity as getPurchaseOrder } from 'app/entities/inventory/purchase-order/purchase-order.reducer';


const statusOptions: any = [
  "PARKED",
  "COMPLETED"
]

export const SupplierReturnUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const poId = searchParams.get('poId');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const supplierReturnEntity = useAppSelector(state => state.supplierReturn.entity);
  const purchaseOrderEntity = useAppSelector(state => state.purchaseOrder.entity);

  const purchaseOrderList = useAppSelector(state => state.purchaseOrder.entities);

  const loading = useAppSelector(state => state.supplierReturn.loading);
  const updating = useAppSelector(state => state.supplierReturn.updating);

  const [supplierReturn, setSupplierReturn] = useState<ISupplierReturn>({
    purchaseOrder: { id: poId },
  });

  const [selectedReturnLines, setSelectedReturnLines] = useState([])


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const returnedIds = supplierReturn?.returnLines?.map(returnLine => returnLine?.orderLineId);

  const filteredOrderLines = supplierReturn?.purchaseOrder?.orderLines?.filter((ordrLine) => !returnedIds?.includes(ordrLine?.id));


  const isDisabled = supplierReturnEntity?.status === "COMPLETED";

  useEffect(() => {
    if (supplierReturnEntity) {
      setSupplierReturn(supplierReturnEntity)
    }
    if (isNew && purchaseOrderEntity) {
      setSupplierReturn((prevState) => ({ ...prevState, purchaseOrder: purchaseOrderEntity }))
    }
  }, [supplierReturnEntity?.id, purchaseOrderEntity.id]);


  useEffect(() => {
    if (isNew && poId) {
      dispatch(getPurchaseOrder(poId));
    }
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    const timer = setTimeout(() => {
      if (!isDisabled) {
        dispatch(getPurchaseOrders({
          query: `status=COMPLETED&filterReturned=${true}`,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        }));
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      dispatch(resetPO());
    }

  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const updatedReturnLines: IReturnLine[] = selectedReturnLines?.filter((orderLine) => orderLine.received - orderLine.returnedQuantity > 0)
      ?.map((orderLine) => ({
        orderLineId: orderLine?.id,
        itemName: orderLine?.item?.name,
        quantity: orderLine.received - orderLine.returnedQuantity,
        returnPrice: orderLine?.price
      }));
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: [...(prevState.returnLines || []), ...updatedReturnLines]
    }));
    setSelectedReturnLines([]);
  };

  const handleReturnQuantityChange = (index, value) => {
    const updatedReturnLines = [...(supplierReturn?.returnLines || [])];
    updatedReturnLines[index] = {
      ...updatedReturnLines[index],
      quantity: Number(value) || 0
    };
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: updatedReturnLines
    }));
  };

  const handleReturnPriceChange = (index, value) => {
    const updatedReturnLines = [...(supplierReturn?.returnLines || [])];
    updatedReturnLines[index] = {
      ...updatedReturnLines[index],
      returnPrice: Number(value) || 0
    };
    setSupplierReturn((prevState) => ({
      ...prevState,
      returnLines: updatedReturnLines
    }));
  };

  const handleRemoveClick = (index) => {
    setSupplierReturn((prevState) => {
      const updatedReturnLines = prevState?.returnLines?.filter((_, i) => i !== index);
      return {
        ...prevState,
        returnLines: updatedReturnLines
      };
    });
  };


  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...supplierReturn,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/inventory/supplier-return/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/inventory/supplier-return/new`)
        }
      })
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold">
          {isNew ? translate('tempApp.supplierReturn.createNew') : translate('tempApp.supplierReturn.edit')}
        </h2>
      </div>

      <div className="max-w-5xl">
        <Card>
          {loading ? (
            <CardContent>
              <p className="text-xs">Loading...</p>
            </CardContent>
          ) : (
            <form className="space-y-4">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <PurchaseOrderCard purchaseOrder={supplierReturn?.purchaseOrder} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-bold">
                    <Translate contentKey="common.status" />
                  </Label>
                  <ButtonGroup>
                    {statusOptions.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={supplierReturn?.status === status ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        disabled={isDisabled}
                        onClick={() => setSupplierReturn(prv => ({ ...prv, status }))}
                      >
                        {status}
                      </Button>
                    ))}
                  </ButtonGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-xs font-bold">
                    <Translate contentKey="common.comment" />
                  </Label>
                  <Textarea
                    value={supplierReturn?.comment || ''}
                    id="comment"
                    disabled={isDisabled}
                    className="h-20 text-xs"
                    onChange={e => setSupplierReturn(prv => ({ ...prv, comment: e.target.value }))}
                  />
                </div>

                {!isDisabled && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold">
                      <Translate contentKey="tempApp.supplier.orderLines" />
                    </h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs w-12 text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={selectedReturnLines.length === filteredOrderLines?.length && filteredOrderLines?.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedReturnLines(filteredOrderLines || []);
                                  } else {
                                    setSelectedReturnLines([]);
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead className="text-xs">{translate('common.item')}</TableHead>
                            <TableHead className="text-xs text-right">{translate('tempApp.supplierReturn.lineTotal')}</TableHead>
                            <TableHead className="text-xs text-right">{translate('common.price')}</TableHead>
                            <TableHead className="text-xs text-right">{translate('tempApp.supplierReturn.receivedQuantity')}</TableHead>
                            <TableHead className="text-xs text-right">{translate('tempApp.supplierReturn.returnedQuantity')}</TableHead>
                            <TableHead className="text-xs text-right">{translate('tempApp.supplierReturn.availableQuantity')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrderLines?.length > 0 ? (
                            filteredOrderLines.map((orderLine) => (
                              <TableRow key={orderLine.id}>
                                <TableCell className="text-xs text-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={selectedReturnLines.some(line => line.id === orderLine.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedReturnLines([...selectedReturnLines, orderLine]);
                                      } else {
                                        setSelectedReturnLines(selectedReturnLines.filter(line => line.id !== orderLine.id));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-xs">{orderLine.item?.name}</TableCell>
                                <TableCell className="text-xs text-right">{orderLine.lineTotal}</TableCell>
                                <TableCell className="text-xs text-right">{orderLine.price}</TableCell>
                                <TableCell className="text-xs text-right">{orderLine.received}</TableCell>
                                <TableCell className="text-xs text-right">{orderLine.returnedQuantity}</TableCell>
                                <TableCell className="text-xs text-right">{orderLine.received - orderLine.returnedQuantity}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-xs text-center text-muted-foreground">
                                {translate('tempApp.supplier.noOrderLines')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <div className="flex justify-end p-2 border-t">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={handleAdd}
                          disabled={selectedReturnLines?.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add To Return Lines
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-bold">
                    <Translate contentKey="tempApp.supplierReturn.returnLines" />
                  </h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order Line ID</TableHead>
                          <TableHead className="text-xs">Item</TableHead>
                          <TableHead className="text-xs">Return Quantity</TableHead>
                          <TableHead className="text-xs">Return Price</TableHead>
                          {!isDisabled && <TableHead className="text-xs w-24">Action</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierReturn?.returnLines?.length > 0 ? (
                          supplierReturn.returnLines.map((returnLine, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs">{returnLine?.orderLineId}</TableCell>
                              <TableCell className="text-xs">{returnLine?.itemName}</TableCell>
                              <TableCell className="text-xs">
                                <Input
                                  type="number"
                                  value={returnLine.quantity}
                                  disabled={isDisabled}
                                  className="h-7 text-xs w-24"
                                  onChange={e => handleReturnQuantityChange(index, e.target.value)}
                                />
                              </TableCell>
                              <TableCell className="text-xs">
                                <Input
                                  type="number"
                                  value={returnLine.returnPrice}
                                  disabled={isDisabled}
                                  className="h-7 text-xs w-24"
                                  onChange={e => handleReturnPriceChange(index, e.target.value)}
                                />
                              </TableCell>
                              {!isDisabled && (
                                <TableCell className="text-xs">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleRemoveClick(index)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={!isDisabled ? 5 : 4} className="text-xs text-center text-muted-foreground">
                              No return lines added
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>

              <div className="flex gap-2 px-2 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate(-1)}
                  id="cancel-save"
                  data-cy="entityCreateCancelButton"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={saveEntity}
                  disabled={updating || isDisabled}
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={(e) => saveEntity(e, true)}
                  disabled={updating || isDisabled}
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

const PurchaseOrderCard = ({ purchaseOrder }) => {
  if (!purchaseOrder) return null;

  const {
    id,
    supplier,
    status,
    datePlaced,
    dateDelivered,
    warehouse,
  } = purchaseOrder;

  const formattedDatePlaced = new Date(datePlaced).toLocaleDateString();
  const formattedDateDelivered = new Date(dateDelivered).toLocaleDateString();

  return (
    <Card className="border-primary">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-sm">
          Purchase Order #{id}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <h5 className="text-sm font-semibold">{supplier?.name}</h5>
        <div className="text-xs space-y-1">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Date Placed:</strong> {formattedDatePlaced}</p>
          <p><strong>Date Delivered:</strong> {formattedDateDelivered}</p>
          <p><strong>Warehouse:</strong> {warehouse?.name}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierReturnUpdate;
