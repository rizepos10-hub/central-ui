import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { SORT } from 'app/shared/util/pagination.constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities } from './loyalty-card.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { GiPayMoney } from 'react-icons/gi';
import AddBalance from './add-balance';
import TransferFunds from './transfer-funds';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

export const GiftCard = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState({
    activePage: 1,
    itemsPerPage: 10,
    sort: 'id',
    order: 'asc',
  });

  const [transferDialogVisibile, setTransferDialogVisible] = useState(false);
  const [addBalanceDialog, setAddBalanceDialog] = useState({
    entity: null,
    visible: false,
  });

  const loyaltyCardList = useAppSelector(state => state.loyaltycard.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const totalItems = useAppSelector(state => state.loyaltycard.totalItems);

  const [filters, setFilters] = useState({
    cardHolderName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    referenceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const getAllEntities = () => {
    const query = {
      first: (paginationState.activePage - 1) * paginationState.itemsPerPage,
      rows: paginationState.itemsPerPage,
      page: paginationState.activePage - 1,
      sortField: paginationState.sort,
      sortOrder: paginationState.order === 'asc' ? 1 : -1,
      query: '',
      filters: {
        code: { value: filters.code?.value, matchMode: FilterMatchMode.CONTAINS },
        cardHolderName: { value: filters.cardHolderName?.value, matchMode: FilterMatchMode.CONTAINS },
        referenceNumber: { value: filters.referenceNumber?.value, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);
    dispatch(
      searchEntities({
        query: updatedQuery,
      })
    );
  };

  // Fetch entities whenever pagination or filters change
  useEffect(() => {
    getAllEntities();
  }, [
    paginationState.activePage,
    paginationState.itemsPerPage,
    paginationState.order,
    paginationState.sort,
    filters.cardHolderName.value,
    filters.referenceNumber.value,
    filters.code.value,
  ]);

  // Reset to first page when filters change
  useEffect(() => {
    setPaginationState(prevState => ({
      ...prevState,
      activePage: 1,
    }));
  }, [filters.cardHolderName.value, filters.referenceNumber.value, filters.code.value]);

  const handleSyncList = () => {
    getAllEntities();
  };

  const addBalanceTemplate = rowData => {
    return (
      <>
        <GiPayMoney
          size={20}
          style={{ cursor: 'pointer' }}
          onClick={() =>
            setAddBalanceDialog({
              entity: rowData,
              visible: true,
            })
          }
        />
      </>
    );
  };

  const handleCreate = () => {
    navigate('/loyalty-cards/new');
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        <Translate contentKey={'loyaltycard.view.table.title'}>Loyalty Cards</Translate>
      </span>
      <div className="ms-auto">
        <Button
          label={translate('loyaltycard.view.table.buttons.transfer')}
          severity="info"
          raised
          className="me-5"
          color="info"
          onClick={() => {
            setTransferDialogVisible(true);
          }}
          disabled={loading}
        >
          &nbsp;
        </Button>
        <Button
          label={translate('loyaltycard.view.table.buttons.refreshList')}
          severity="secondary"
          raised
          className="me-5"
          color="info"
          onClick={handleSyncList}
          disabled={loading}
        >
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button
          label={translate('loyaltycard.view.table.buttons.create')}
          raised
          onClick={handleCreate}
          disabled={loading}
        >
          &nbsp;
        </Button>
      </div>
    </div>
  );

  // Handle pagination and rows per page changes
  const onPage = event => {
    setPaginationState({
      ...paginationState,
      activePage: event.page + 1,
      itemsPerPage: event.rows,
    });
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/loyalty-cards/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const onTransferFundsCloseHandle = () => {
    setTransferDialogVisible(false)
    getAllEntities()
  }

  return (
    <div>
      <TransferFunds
        transferDialogVisibile={transferDialogVisibile}
        onCloseHandle={onTransferFundsCloseHandle}
      />

      <AddBalance addBalanceDialog={addBalanceDialog} setAddBalanceDialog={setAddBalanceDialog} />

      <DataTable
        value={loyaltyCardList}
        header={header}
        paginator
        showGridlines
        filters={filters}
        filterDisplay="row"
        totalRecords={totalItems}
        rows={paginationState.itemsPerPage}
        first={(paginationState.activePage - 1) * paginationState.itemsPerPage}
        rowsPerPageOptions={[10, 20, 30, 40, 50, 100, 200]}
        lazy
        onPage={onPage}
        loading={loading}
      >
        <Column
          field="cardHolderName"
          header={translate('common.cardHolderName')}
          filter
          filterField="cardHolderName"
          filterElement={
            <InputText
              placeholder={translate('common.cardHolderName')}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  cardHolderName: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                }))
              }
            />
          }
        />

        <Column
          field="referenceNumber"
          header={translate('common.referenceNumber')}
          filter
          filterField="referenceNumber"
          filterElement={
            <InputText
              placeholder={translate('common.referenceNumber')}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  referenceNumber: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                }))
              }
            />
          }
          filterPlaceholder={translate('common.referenceNumber')}
        />
        <Column
          field="code"
          header={translate('common.code')}
          filter
          filterField="code"
          filterElement={
            <InputText
              placeholder={translate('common.code')}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  code: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
                }))
              }
            />
          }
          filterPlaceholder={translate('common.code')}
        />
        <Column
          field="wallet.balance"
          header={translate('common.walletBalance')}
          body={rowData => rowData?.wallet?.balance}
        />
        <Column field="printed" header={translate('common.printed')} />
        <Column field="active" header={translate('common.active')} />
        <Column
          header={translate('common.expiryDate')}
          body={rowData => (rowData?.expiryDate ? new Date(rowData?.expiryDate).toDateString() : null)}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
        <Column
          header={translate('common.addBalance')}
          body={addBalanceTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
        <Column
          header={translate('common.edit')}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

      </DataTable>
    </div>
  );
};

export default GiftCard;
