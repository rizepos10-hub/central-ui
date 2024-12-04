import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { getEntities } from './pos-authority-group.reducer';

export const PosAuthorityGroup = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const PosAuthorityGroupList = useAppSelector(state => state.posAuthorityGroup.entities);
  const loading = useAppSelector(state => state.posAuthorityGroup.loading);
  const totalItems = useAppSelector(state => state.posAuthorityGroup.totalItems);

  const getPosAuthorityGroupList = () => {
    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: 1000,
    }))
  }

  useEffect(() => {
    getPosAuthorityGroupList()
  }, []);

  const nameColumnTemplate = (rowData) => {
    const editUrl = `/pos-authority-group/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };

  const editColumnTemplate = (rowData) => {
    const editUrl = `/pos-authority-group/${rowData.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/pos-authority-group/${rowData.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };
  const handleCreate = () => {
    navigate('/pos-authority-group/new');
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold"><Translate contentKey={'tempApp.posUsers'} /></span>
      <div className="ms-auto">
        <Button label={translate("common.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={getPosAuthorityGroupList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("tempApp.pos-authority-group.create")} raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );

  return (
    <div >
      <DataTable
        value={PosAuthorityGroupList}
        header={header}
        paginator
        showGridlines
        loading={loading}
        totalRecords={totalItems}
        rows={20}
      >
        <Column
          field="name"
          header={translate("common.name")}
          body={nameColumnTemplate}
        />

        <Column
          field="description"
          header={translate("common.description")}
        />

        <Column
          field="authorities"
          header={translate("tempApp.authorities")}
          body={(rowData) => rowData.authorities.join(' | ')}
        />

        <Column
          header={translate("common.edit")}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header="Delete"
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%', }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default PosAuthorityGroup;
