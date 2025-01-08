import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Translate, translate, TextFormat, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IMenu } from 'app/shared/model/menu.model';
import { searchEntities, getEntities, createEntity } from './menu.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from "primereact/column";
import { format } from "date-fns";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import MenuUpdate from './menu-update';
import { convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { IBranch } from 'app/shared/model/branch.model';

export const Menu = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log(isModalOpen)

  const menuList = useAppSelector(state => state.menu.entities);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);

  const totalItems = useAppSelector(state => state.menu.totalItems);
  const [filters, setFilters] = useState({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'branch.name': { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const params = new URLSearchParams(location.search);
  const menuType = params.get("type");

  const [selectedBranches, setSelectedBranches] = useState<IBranch[]>([]);
  const [selectedName, setSelectedName] = useState("");

  const getAllEntities = () => {

    if (search) {
      dispatch(
        searchEntities({
          query: search,
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
          type: menuType,
        })
      );
    }
  };

  const handleCreate = () => {
    navigate(`/menu/new?type=${menuType}`)
  }

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;

  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search, menuType, updateSuccess]);

  useEffect(() => {
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


  const handleSyncList = () => {
    sortEntities();
  };

  const branchNames = new Set(menuList.filter(item => item.branch?.name !== undefined || null).map((menu) => menu.branch?.name));

  const branchFilterOptions = Array.from(branchNames).map((branchName) => ({ label: branchName, value: branchName }));

  const branchFilter = (
    <Dropdown
      value={filters['branch.name']?.value}
      options={branchFilterOptions}
      onChange={(e) => {
        const updatedFilters = {
          ...filters,
          'branch.name': { value: e.value, matchMode: FilterMatchMode.EQUALS },
        };
        setFilters(updatedFilters);
      }}
      placeholder={translate('menus.shared.view.table.select.branch')}
    />
  )

  const editColumnTemplate = (rowData) => {
    const editUrl = `/menu/${rowData.id}/${menuType}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.5rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/menu/${rowData.id}/delete?type=${menuType}&page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '-0.6rem' }} />
      </Link>
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">{menuType === "ONLINE_ORDERING" ?
        translate('menus.online.view.table.title') :
        translate('menus.pos.view.table.title')}</span>
      <div className="ms-auto">
        <Button label={translate("menus.shared.view.table.buttons.refreshList")} severity="secondary" raised className="me-5" color="info" onClick={handleSyncList} disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Button label={translate("menus.shared.view.table.buttons.createNewMenu")} raised onClick={() => setIsModalOpen(true)} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div>
  );


  const saveEntity = values => {
    values.createdDate = convertDateTimeToServer(values.createdDate);
    values.lastModifiedDate = convertDateTimeToServer(values.lastModifiedDate);

    const entity = {
      ...values,
      branches: selectedBranches,
      type: menuType,
    };

    dispatch(createEntity(entity)).then((res) => {
      setIsModalOpen(false);
      navigate(`/menu/${(res.payload as any).data.id}/${menuType}/edit?page=1&sort=sort=id,asc`);
    });
  };

  return (
    <>
      <MenuUpdate
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        saveEntity={saveEntity}
        updating={updating}
        selectedName={selectedName}
        setSelectedName={setSelectedName}
        selectedBranches={selectedBranches}
        setSelectedBranches={setSelectedBranches}
      />
      <div>
        <DataTable value={menuList} header={header} editMode="row"
          loading={loading} filters={filters} filterDisplay="row"
          paginator totalRecords={totalItems} rows={20}>
          <Column
            header={translate('menus.shared.view.table.fields.name')}
            field="name"
            sortable
            filterPlaceholder={translate('menus.shared.view.table.search.name')} filter
            body={(rowData) => (
              <Link to={`/menu/${rowData.id}/${menuType}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>{rowData.name}</Link>)}
            style={{ width: '20%' }}
          />
          <Column
            field="branch.name"
            header={translate('menus.shared.view.table.fields.branch')}
            sortable
            filter
            filterElement={branchFilter}
            filterField={"branch.name"}
          />
          <Column
            field="lastModifiedDate"
            header={translate('menus.shared.view.table.fields.updatedAt')}
            sortable
            body={(rowData) => format(new Date(rowData.lastModifiedDate), 'yyyy-MM-dd HH:mm:ss')}
          />
          <Column header="Edit" body={editColumnTemplate} headerStyle={{ width: '5%' }} bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }} />
          <Column header="Delete" body={deleteColumnTemplate} headerStyle={{ width: '5%' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
        </DataTable>
      </div>
    </>
  );
};

export default Menu;
