// EndOfDayReportContainer.tsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Spinner } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from 'app/config/store';
import DynamicEndOfDayReportUI from './dynamic-end-of-day-report';

const EndOfDayReportContainer = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const printWrapperRef = useRef(null);

  const [endOfDay, setEndOfDay] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    };
    fetchData();
  }, [id, dispatch]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <DynamicEndOfDayReportUI
      reportData={salesData}
      endOfDay={endOfDay}
      printWrapperRef={printWrapperRef}
      loading={loading}
      title="End OF Day Report"
    />
  );
};

export default EndOfDayReportContainer;
