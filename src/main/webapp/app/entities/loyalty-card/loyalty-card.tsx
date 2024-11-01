import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { searchEntities, getEntities, addBalance } from './loyalty-card.reducer';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { GiPayMoney } from "react-icons/gi";
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Label } from 'reactstrap';
import AddBalance from './add-balance';
import TransferFunds from './transfer-funds';

export const GiftCard = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [transferDialogVisibile, setTransferDialogVisible] = useState(false);
  const [addBalanceDialog, setAddBalanceDialog] = useState({
    entity: null,
    visible: false
  });


  const loyaltyCardList = useAppSelector(state => state.loyaltycard.entities);
  const loading = useAppSelector(state => state.loyaltycard.loading);
  const totalItems = useAppSelector(state => state.loyaltycard.totalItems);

  const [filters, setFilters] = useState({
    firstName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    lastName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    phone: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  console.log(loyaltyCardList, 'loyaltyCardList')
  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search || '',
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
          query: search || '',
        })
      );
    }
  };

  const startSearching = e => {
    if (search) {
      setPaginationState({
        ...paginationState,
        activePage: 1,
      });
      dispatch(
        searchEntities({
          query: search || '',
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
    e.preventDefault();
  };

  const clear = () => {
    setSearch('');
    setPaginationState({
      ...paginationState,
      activePage: 1,
    });
    dispatch(getEntities({}));
  };

  const handleSearch = event => setSearch(event.target.value);

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  const firstNameColumnTemplate = rowData => {
    const editUrl = `/loyalty-cards/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.firstName}
      </Link>
    );
  };

  const handleNameFilterChange = (e) => {
    const filterValue = e.target.value;
    if (filterValue === '') {
      setFilters({
        ...filters,
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      });
    } else {
      setFilters({
        ...filters,
        name: { value: filterValue, matchMode: FilterMatchMode.CONTAINS },
      });
    }
  };



  const editColumnTemplate = (rowData) => {
    const editUrl = `/loyalty-cards/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/loyalty-cards/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const addBalanceTemplate = (rowData) => {
    return (
      <>
        <GiPayMoney size={20} style={{ cursor: 'pointer' }} onClick={() => setAddBalanceDialog({
          entity: rowData,
          visible: true
        })} />
      </>
    )
  }

  const handleCreate = () => {
    navigate('/loyalty-cards/new')
  }
  console.log(loyaltyCardList, 'loyaltyCardList')
  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'loyaltycard.view.table.title'}>Loyalty Cards</Translate></span>
      <div className="ms-auto">
        <Button label={translate('loyaltycard.view.table.buttons.transfer')} severity="info" raised className="me-5" color="info" onClick={() => {
          setTransferDialogVisible(true)
        }} disabled={loading}>
          &nbsp;
        </Button>
        <Button label={translate('loyaltycard.view.table.buttons.refreshList')} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate('loyaltycard.view.table.buttons.create')} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>

  );


  return (
    <div>
      <TransferFunds
        transferDialogVisibile={transferDialogVisibile}
        setTransferDialogVisible={setTransferDialogVisible}
      />

      <AddBalance
        addBalanceDialog={addBalanceDialog}
        setAddBalanceDialog={setAddBalanceDialog}
      />

      <DataTable value={loyaltyCardList} editMode="row" header={header} paginator showGridlines
        filters={filters} filterDisplay="row" totalRecords={totalItems} rows={20}>

        <Column
          field="cardHolderName" header={translate('common.cardHolderName')} filter
          filterElement={<InputText placeholder={translate('common.cardHolderName')} onChange={handleNameFilterChange} />}
          filterField="cardHolderName" sortable
        />

        <Column field="code" header={translate('common.code')} filter filterPlaceholder={translate('common.code')} sortable />
        <Column field="printed" header={translate('common.printed')} filter filterPlaceholder={translate('common.printed')} sortable />
        <Column field="referenceNumber" header={translate('common.referenceNumber')} filter filterPlaceholder={translate('common.referenceNumber')} sortable />
        <Column field="walletId" header={translate('common.walletId')} filter filterPlaceholder={translate('common.walletId')} sortable />

        <Column header={translate('common.addBalance')} body={addBalanceTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('common.edit')} body={editColumnTemplate} headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />

        <Column header={translate('common.delete')} body={deleteColumnTemplate} headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />


      </DataTable>
    </div>
  );
};

export default GiftCard;
