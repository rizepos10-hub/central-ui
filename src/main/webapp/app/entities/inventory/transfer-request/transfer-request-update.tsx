import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, createEntity, reset } from './transfer-request.reducer';
import {ITransferRequest, ITRItem} from "app/shared/model/STOCK/transfer-request.model";
import {getEntities as getWarehouses} from "app/entities/inventory/warehouse/warehouse.reducer";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import  {searchEntities as getStockItems} from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { getEntities as getSalesLocations } from "app/entities/inventory/sales-location/sales-location.reducer";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import {InputNumber} from "primereact/inputnumber";
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";

export const TransferRequestUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const transferRequestEntity = useAppSelector(state => state.transferRequest.entity);
  const warehouseList = useAppSelector(state => state.warehouse.entities);
  const salesLocationList = useAppSelector(state => state.salesLocation.entities);

  const loading = useAppSelector(state => state.transferRequest.loading);
  const updating = useAppSelector(state => state.transferRequest.updating);
  const updateSuccess = useAppSelector(state => state.transferRequest.updateSuccess);
  const stockItemsList = useAppSelector(state => state.stockQuantity.entities);

  console.log(stockItemsList, 'stockItemsList')
  const [transferRequest, setTransferRequest] = useState<ITransferRequest>({

  });

  const [transferRequestItem, setTransferRequestItem] = useState<ITRItem>();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const warehousesAndSalesLocations = [...(warehouseList || []),...(salesLocationList || [])];

  const filteredStockItems = useMemo(() => {
    return stockItemsList.filter(stockConfig => !transferRequest.transferItems?.some(TRItem => TRItem.item.variantId === stockConfig.variantId))
  }, [transferRequest.transferItems?.length, stockItemsList]);

  // filtering the destination if the selected source if from type sales location because we cant transfer from sales location to a sales location
  const destinationOptions = transferRequest?.source?.type === "SALES_LOCATION" ?
    warehousesAndSalesLocations?.filter((opt) => opt.id !== transferRequest?.source.id || opt.type !== "SALES_LOCATION")
    :
    warehousesAndSalesLocations?.filter((opt) => opt.id !== transferRequest?.source?.id);

  const query = transferRequest?.source?.id ? `location=${transferRequest?.source?.id}&` : null

  const handleClose = () => {
    navigate('/inventory/transfer-request' + location.search);
  };

  const handleAdd = () => {
    setTransferRequest((prevState) => ({
      ...prevState,
      transferItems: [...(prevState.transferItems || []), transferRequestItem]
    }));
    setTransferRequestItem(null);
  };


  const handleSelectItem = (selectedItem) => {
    const itemToTransfer = {
      ...selectedItem,
      name: selectedItem.itemName
    }
    setTransferRequestItem(prevState => ({...prevState, item: itemToTransfer}))
  }

  console.log(transferRequestItem, 'transferRequestItem')
  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getWarehouses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`}));

    dispatch(getSalesLocations({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));



  }, []);

  useEffect(() => {
    {query &&
      dispatch(getStockItems({
        query,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      }));
    }
  }, [query])



  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if(transferRequestEntity){
      setTransferRequest(transferRequestEntity)
    }
  }, [updateSuccess, transferRequestEntity?.id]);

  const filterItems = (inputValue: string) => {
    return filteredStockItems.filter((i) => {
        return (
          i.description.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
    );
  };

  const loadItems = (
    inputValue: string,
    callback: (options: IPurchaseConfig[]) => void
  ) => {
    setTimeout(() => {
      try {
        const filteredOptions = filterItems(inputValue);
        callback(filteredOptions);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    }, 1000);
  };


  const deleteColumnTemplate = (rowData, index) => {
    const {rowIndex} = index
    const handleClick = () =>  {
      setTransferRequest((prevState) => {
        const updatedItems = prevState?.transferItems?.filter((_, i) => i !== rowIndex);
        return {
          ...prevState,
          transferItems: updatedItems
        }
      });
    }
    return (
      <FontAwesomeIcon onClick={handleClick} icon="trash" style={{ cursor: 'pointer' , color: 'red', marginLeft: '1rem'}} />
    );
  };


  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...transferRequest,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    }
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ?  "Add New Transfer Request" : "View Transfer Request"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column"}>
                  <Label for="source">Source</Label>
               <Select
                  value={transferRequest?.source}
                  options={warehousesAndSalesLocations}
                  getOptionLabel={option => option?.name}
                  getOptionValue={option => option.id}
                  id="source"
                  isDisabled={!isNew}
                  onChange={(source) => setTransferRequest((prv) => ({...prv, source}))}
               />
                </div>

                <div className={"d-flex flex-column mt-2"}>
                  <Label for="destination">Destination</Label>
                  <Select
                    value={transferRequest?.destination}
                    options={destinationOptions}
                    getOptionLabel={option => option?.name}
                    getOptionValue={option => option.id}
                    id="destination"
                    isDisabled={!transferRequest.source || !isNew}
                    onChange={(destination) => setTransferRequest((prv) => ({...prv, destination}))}
                  />
                </div>


                {isNew ? <Row className={"mt-3"}>
                  <h3>Transfer Items</h3>
                  <Table>
                    <tbody>
                    <tr>
                      <td>Item</td>
                      <td>Quantity in Source</td>
                      <td>Quantity To Transfer</td>
                    </tr>
                    <tr>
                      <td className={'w-2'}>
                        <AsyncSelect
                          cacheOptions
                          loadOptions={loadItems}
                          defaultOptions={filteredStockItems}
                          getOptionValue={option => option.variantId}
                          getOptionLabel={option => option.itemName}
                          onChange={handleSelectItem}
                          value={transferRequestItem?.item || null}
                          isDisabled={!transferRequest.source}

                        />
                      </td>
                      <td className={"w-1 "}>
                     <InputNumber value={transferRequestItem?.item?.quantity} disabled />
                      </td>
                      <td className={'w-1'}>
                        <InputNumber
                          value={transferRequestItem?.quantity} disabled={!transferRequest.source || transferRequestItem?.item?.quantity <= 0}
                          max={transferRequestItem?.item?.quantity}
                          onChange={(e) => setTransferRequestItem((prevState => ({
                            ...prevState,
                            quantity: e.value
                          })))}
                        />

                      </td>

                      <td className={'w-2'}>
                        <Button disabled={!transferRequestItem || transferRequestItem?.item?.quantity <= 0} color={"success"} onClick={handleAdd}>Add</Button>
                      </td>

                    </tr>
                    </tbody>
                  </Table>
                </Row> : null}
                <Row className={"mt-3"}>
                  <DataTable
                    value={transferRequest?.transferItems}
                    editMode="row"
                    header={"Transferred Items"}
                    removableSort
                    paginator
                    totalRecords={transferRequest?.transferItems?.length}
                    rows={10}
                  >
                    <Column field="item.name" header={"Item"} />
                    <Column field="quantity" header={"Transferred Quantity"} />

                    {isNew ? <Column header={"Delete"} body={deleteColumnTemplate} headerStyle={{width: '1%',}}
                             bodyStyle={{textAlign: '-moz-initial', overflow: 'visible'}}/> : null}
                  </DataTable>
                </Row>

              </FormGroup>
              <Button tag={Link} to="/inventory/transfer-request" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              {isNew ?<Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save"/>
                &nbsp;Save
              </Button> : null}
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TransferRequestUpdate;
