import React from 'react';
import { useAppDispatch } from 'app/config/store';
import {  updateEntity } from './till.reducer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ITill } from 'app/shared/model/till.model';
import { InputNumber } from 'primereact/inputnumber';
import { convertDateTimeFromServer, toLocalISOString } from 'app/shared/util/date-utils';

export const CurrentTill = ({ till }: { till: ITill }) => {
  const dispatch = useAppDispatch();
 
  const onRowEditComplete = e => {
    const entity = e.newData as ITill;
    dispatch(updateEntity(entity));
  };

 
 
  const InputNumberEditor = options => {
    return <InputNumber value={options.value} onValueChange={e => options.editorCallback(e.value)} />;
  };

  const allowEdit = (rowData: ITill) => {
    return rowData.status === 'OPENED';
  };




  return (
    <div>
      <DataTable value={[till]} editMode="row" dataKey="id" onRowEditComplete={onRowEditComplete}>
        <Column field="openAmount" header="Open Amount" editor={options => InputNumberEditor(options)} />
        <Column field="status" header="Status" />
        <Column
          field="startDate"
          body={rowData => convertDateTimeFromServer(rowData?.startDate)}
          header="Start Date"
        />
        <Column
          field="endDate"
          body={rowData => convertDateTimeFromServer(rowData?.endDate)}
          header="End Date"
        />

        <Column rowEditor={allowEdit} headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
      </DataTable>
    </div>
  );
};

export default CurrentTill;
