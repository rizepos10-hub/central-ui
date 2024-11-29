import React, { useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ICourseDefinition } from 'app/shared/model/COURSE-DEFINITION/course-definition';
import { changeEntityField, getEntities } from './course-definition.reducer';
import { translate } from 'react-jhipster';

export const CourseDefinition = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const courseDefinitionList: ICourseDefinition[] = useAppSelector(state => state.courseDefinition.entities);
  const loading = useAppSelector(state => state.courseDefinition.loading);

  const courseDefinitionListSorted = useMemo(() => {
    if (!courseDefinitionList) return [];

    return [...courseDefinitionList].sort((a, b) => {
      const orderA = a?.order ?? 0;
      const orderB = b?.order ?? 0;
      return orderA - orderB;
    });
  }, [courseDefinitionList]);


  useEffect(() => {
    dispatch(getEntities({
      page: 0,
      size: 1000,
      sort: 'id,desc'
    }));
  }, []);


  const editColumnTemplate = (rowData) => {
    const editUrl = `/course-definition/${rowData.id}/edit`;
    return (
      <Link to={editUrl}>
        <FontAwesomeIcon icon="pencil-alt" style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }} />
      </Link>
    );
  };

  const deleteColumnTemplate = (rowData) => {
    const deleteUrl = `/course-definition/${rowData.id}/delete`;
    return (
      <Link to={deleteUrl}>
        <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }} />
      </Link>
    );
  };

  const handleCreate = () => {
    navigate('/course-definition/new')
  }

  const handleOrderChange = (e) => {
    console.log(e, 'eawawdaw')
  }

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">Course Definitions</span>
      <div className="ms-auto">
        <Button label="Add New Course Definition" raised onClick={handleCreate} disabled={loading}>
          &nbsp;
        </Button>
      </div>
    </div >
  );

  return (
    <div className="card">
      <DataTable
        value={courseDefinitionListSorted}
        // reorderableColumns
        // reorderableRows
        // onRowReorder={(e) => handleOrderChange(e)}
        tableStyle={{ minWidth: '50rem' }}
        header={header}
      >
        <Column rowReorder style={{ width: '3rem' }} />
        <Column field="order" header="Order" filter filterPlaceholder={"Search by name"} sortable />
        <Column field="name" header="Name" filter filterPlaceholder={"Search by name"} sortable />
        <Column field="description" header="Description" filter filterPlaceholder={"Search by description"} sortable />

        <Column
          header={translate('items.view.fields.edit')}
          body={editColumnTemplate}
          headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />

        <Column
          header={translate('items.view.fields.delete')}
          body={deleteColumnTemplate}
          headerStyle={{ width: '1%' }}
          bodyStyle={{ textAlign: '-moz-initial', overflow: 'visible' }}
        />
      </DataTable>
    </div>
  );
};

export default CourseDefinition;
