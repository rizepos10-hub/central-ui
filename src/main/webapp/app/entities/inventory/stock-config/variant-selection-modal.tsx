import React, { useEffect, useState } from 'react';
import {Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter, Spinner} from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import {getSortState, translate, Translate} from 'react-jhipster';
import {searchEntities as searchItems} from "app/entities/inventory/stock-config/items-stock-config.reducer";
import {InputText} from "primereact/inputtext";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {IQueryParams} from "app/shared/reducers/reducer.utils";

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  onSelectItem: any;
}

const VariantSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.itemForStock.totalItems);
  const itemsForStock = useAppSelector(state => state.itemForStock.entities);
  const loadingItems = useAppSelector(state => state.itemForStock.loading);




  const { isOpen, toggle, onSelectItem } = props;


  const [searchTerm, setSearchTerm] = useState('');

  const [queryParams, setQueryParams] = useState<IQueryParams>({
    size: 10,
    query: '',
    page: 0
  });

  const currentPage = queryParams?.page;


  const handleSearch = e => {
    if(e?.key !== "Enter") return;
    if(!searchTerm) return;
    e.preventDefault();
    dispatch(searchItems({
      query: searchTerm
    }));
  };


  const handlePageChange = (newPage: number) => {
    setQueryParams(prev => ({...prev, page: newPage}));
  };


  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.stockConfig.title'}>StockConfigs</Translate></span>
      <div className="ms-auto">
       <InputText
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         onKeyDown={handleSearch}
         />
        <i
        className="pi pi-search mt-2 cursor-pointer"
        style={{fontSize: '1.8rem'}}
        onClick={handleSearch}
      />
      </div>
    </div>
  );






  return (
    <Modal size="xl" isOpen={isOpen} toggle={toggle}  backdrop="static">
      <ModalHeader toggle={toggle}>
        {translate("common.search.item")}
      </ModalHeader>
      <ModalBody>

        <FormGroup>

          <DataTable
            value={itemsForStock}
            editMode="row"
            header={header}
            removableSort
            paginator
            totalRecords={totalItems}
            rows={queryParams?.size}
          >

            <Column field="item.name" header={translate("common.item")} />

            <Column field="quantity" header={translate("common.quantity")} />

            <Column field="price" header={translate("common.price")} />

            <Column  header={translate("common.subtotal")} body={(rowData) => rowData.price * rowData.quantity} />


          </DataTable>

        <div className="d-flex justify-content-center mt-3">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            color="primary"
            className="mr-2"
          >
            <Translate contentKey={'common.previous'}>Previous</Translate>
          </Button>
          <span>Page {currentPage}</span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * queryParams?.size >= totalItems}
            color="primary"
            className="ml-2"
          >
            <Translate contentKey={'common.next'}>Next</Translate>
          </Button>
        </div>
        </FormGroup>
      </ModalBody>
      <ModalFooter>

      </ModalFooter>
    </Modal>
  );
};

export default VariantSelectionModal;
