// EndOfDayReportContainer.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Spinner } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from 'app/config/store';
import { getEntities as getBusiness } from 'app/entities/settings/business-details/business-detail.reducer';
import { fetchFirstLastBills } from '../../api';
import DynamicEndOfDayReportUI from './dynamic-end-of-day-report';

const EndOfDayReportContainer = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const printWrapperRef = useRef(null);

  const [endOfDay, setEndOfDay] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [endOfDayReportSection, setEndOfDayReportSection] = useState<any>(null);
  const [billsSummary, setBillsSummary] = useState<any>(null);
  const [businessDetailsState, setBusinessDetailsState] = useState<any>(null);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/end-of-day/${id}`);
      const reportData = JSON.parse(data.report);
      setEndOfDay(data);
      setSalesData(reportData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleSubmit();
      dispatch(getBusiness({})).then((res: any) => {
        setBusinessDetailsState(res.payload.data[0]);
      });
    };
    fetchData();
  }, [id, dispatch]);

  useEffect(() => {
    if (businessDetailsState) {
      const branchIdFromUrl = new URLSearchParams(window.location.search).get('branchId');
      if (branchIdFromUrl) {
        const selectedBranch = businessDetailsState.branchDetails.find(
          (branch: any) => branch?.branchId.toString() === branchIdFromUrl
        );
        setEndOfDayReportSection(selectedBranch?.endOfDayReportSection);
      }
    }
  }, [businessDetailsState]);

  useEffect(() => {
    fetchFirstLastBills(id).then((result) => {
      setBillsSummary(result.data);
    });
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <DynamicEndOfDayReportUI
      reportData={salesData}
      endOfDay={endOfDay}
      billsSummary={billsSummary}
      endOfDayReportSection={endOfDayReportSection}
      printWrapperRef={printWrapperRef}
      loading={loading}
      title="End OF Day Report"
    />
  );
};

export default EndOfDayReportContainer;
