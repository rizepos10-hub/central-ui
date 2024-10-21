import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './custom-definitions.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { initialState } from 'app/shared/reducers/authentication';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export const CustomDefinition = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const customDefinitions = useAppSelector(state => state.customDefinitions.entities);
  const loading = useAppSelector(state => state.customDefinitions.loading);
  const totalItems = useAppSelector(state => state.customDefinitions.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  useEffect(() => {
    dispatch(getEntities({
      page: 0,
      size: 10,
      sort: 'id,asc',
    }))
  }, []);

  const editColumnTemplate = rowData => {
    const editUrl = `/custom-definitions/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = rowData => {
    const deleteUrl = `/custom-definitions/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/custom-definitions/new')
  }

  const onPage = event => {
    const queryParams = JSON.stringify({
      first: event.first,
      page: event.page,
      rows: event.rows,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    });
    setSearchParams({ query: queryParams }, { replace: true });

    // Dispatch the updated page data
    dispatch(getEntities({
      page: event.page,
      size: 10,
      sort: `${event.sortField},${event.sortOrder === 1 ? 'asc' : 'desc'}`,
    }));
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        <Translate contentKey={'common.customDefinitions'}>Custom Definitions</Translate>
      </span>
      <div className="ms-auto">
        <Button
          label={translate('common.create')}
          raised
          onClick={handleCreate}
          disabled={loading}
        />
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        value={customDefinitions}
        editMode="row"
        removableSort
        filterDisplay="row"
        paginator
        totalRecords={totalItems}
        rows={10}
        lazy
        first={0}
        onPage={onPage}
        loading={loading}
        header={header}
        sortField={query.sortField}
        sortOrder={query.sortOrder}
        showGridlines
      >
        <Column
          field="name"
          header={translate('common.name')}
        />
        <Column field="label" header={translate('common.label')} />
        <Column field="type" header={translate('common.type')} />
        <Column field="required" header={translate('common.required')} />
        <Column field="display" header={translate('common.display')} />
        <Column
          header={translate('common.edit')}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header={translate('common.delete')}
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default CustomDefinition;
