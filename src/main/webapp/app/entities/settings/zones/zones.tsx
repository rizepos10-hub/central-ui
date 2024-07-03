import React, { useCallback, useEffect, useState } from 'react';
import { ControlPosition, Map, MapControl } from '@vis.gl/react-google-maps';

import { PolygonPath, useDrawingManager } from 'app/shared/components/google/hooks/use-drawing-manager';
import { UndoRedoControl } from 'app/shared/components/google/undo-redo-control';
import { changeEntityField, getEntities } from './zones.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { InputText } from 'primereact/inputtext';
import { IZone } from 'app/shared/model/ZONE/zone.model';
import { DataTable } from 'primereact/datatable';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';

export const Zones = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const zones: IZone[] = useAppSelector(state => state.zones.entities);
  const loading = useAppSelector(state => state.zones.loading);
  const totalItems = useAppSelector(state => state.zones.totalItems);

  useEffect(() => {
    dispatch(getEntities({}))
  }, [])




  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Zones</span>
      <div className="ms-auto">
        <Button label={"Refresh List"} severity="secondary" raised className="me-5" color="info" type='button' disabled={loading}>
          &nbsp;
          <FontAwesomeIcon icon="sync" spin={loading} />{' '}
        </Button>
        <Link to='/zones/new'>
          <Button label={"Create New Zone"} raised disabled={loading}>
            &nbsp;
          </Button>
        </Link>
      </div>
    </div>
  );

  const nameColumnTemplate = rowData => {
    const editUrl = `/zones/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        {rowData.name}
      </Link>
    );
  };


  return (
    <form>
      <DataTable
        value={zones}
        editMode="row"
        header={header}
        paginator
        showGridlines
        globalFilterFields={['firstName', 'lastName']}
        loading={loading}
        filterDisplay="row"
        totalRecords={totalItems}
        rows={20}
      >
        <Column
          field="name"
          header={"Name"}
          body={nameColumnTemplate}
          sortable
        />
      </DataTable>
    </form>
  )
};

export default Zones;