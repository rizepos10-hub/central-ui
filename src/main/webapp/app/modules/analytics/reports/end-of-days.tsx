import React, {useEffect, useState} from "react";
import {Row} from "reactstrap";
import {fetchEndOfDaysData} from "app/modules/analytics/api";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {Link, useNavigate} from "react-router-dom";
import {Dropdown} from "primereact/dropdown";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {translate, Translate} from "react-jhipster";
import {convertUtcToLocalDate, } from "app/shared/util/date-utils";




export const EndOfDays = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const branchList = useAppSelector(state => state.branch.entities)
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(null);


  const [endOfDaysData, setEndOFDaysData] = useState([])
  const [lazyState, setLazyState] = useState({
    first: 0,
    page: 0,
    rows: 10,
    sortField: null,
    sortOrder: null,
  });


  const filteredBranchOptions = [
    { label: "All", value: null },
    ...branchList
      .map((branch) => ({
        label: branch.name,
        value: branch.id,
      }))];



  useEffect(() => {
    loadLazyData();
    dispatch(getBranches({}))
  }, [lazyState, selectedBranch]);

  const loadLazyData = async () => {
    setLoading(true);
    try {
      const result = await fetchEndOfDaysData(
        lazyState.page,
        lazyState.rows,
        lazyState.sortField,
        lazyState.sortOrder,
        selectedBranch
      );
      setTotalRecords(Number(result.headers['x-total-count']))
      setEndOFDaysData(result.data)
      console.log(result, 'result')
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  const onPage = (event) => {
    setLazyState(event);
  };

  const onSort = (event) => {
    setLazyState(event);
  };

  const onFilter = (event) => {
    event['first'] = 0;
    setLazyState(event);
  };




  return (
    <Row>
      <h2><Translate contentKey={'analytics.endOfDay.title'}>End Of Day Reports</Translate></h2>
      <div className="d-flex  justify-content-start gap-5 ">

        <Dropdown
          style={{minWidth: '7rem'}}

          value={selectedBranch}
          options={filteredBranchOptions}
          onChange={(e) => setSelectedBranch(e.value)}
          placeholder={translate('analytics.endOfDay.select')}
        />
      </div>
      <div className="card my-3">
      <DataTable  value={endOfDaysData} lazy filterDisplay="row" dataKey="id" paginator
                 first={lazyState.first} rows={20} totalRecords={totalRecords} onPage={onPage}
                 onSort={onSort} sortField={lazyState.sortField} sortOrder={lazyState.sortOrder}
                 onFilter={onFilter} loading={loading} tableStyle={{ minWidth: '75rem' }}
                  selectionMode="single" onSelectionChange={(e) => navigate(`/analytics/endofday/${e.value.id}`)}
                >

        {/* <Column field="id" header="ID" body={(rowData) => (<Link to={rowData.id}>{rowData.id} </Link>)}  /> */}
        <Column field="toDate" body={(rowData) => convertUtcToLocalDate(rowData?.toDate)} header={translate('analytics.endOfDay.table.toDate')} />
        <Column field="fromDate" body={(rowData) => convertUtcToLocalDate(rowData?.fromDate)} header={translate('analytics.endOfDay.table.fromDate')} />
        <Column field="actionTakenBy" header={translate('analytics.endOfDay.table.actionBy')} />
        <Column field="createdDate" body={(rowData) => convertUtcToLocalDate(rowData?.createdDate)}  header={translate('analytics.endOfDay.table.createdDate')} />
        <Column field="branch.name" header={translate('analytics.endOfDay.table.branchName')} />
        <Column field="branch.appName" header={translate('analytics.endOfDay.table.appName')} />
        <Column field="branch.appType" header={translate('analytics.endOfDay.table.appType')} />
      </DataTable>
      </div>

    </Row>
  )
}
