import axios from 'axios';
import { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';
import { IHouseChargesReportRow } from 'app/shared/model/house-charges-report.model';
import { ISalesActivitySummaryReport } from 'app/shared/model/sales-activity-summary-report.model';



// api/report/sales

export const fetchSalesReport = async ({ dateRange, measure, type, branchId = null }) => {
  try {
    const { from, to, dateSlot } = dateRange;

    const requestData = {
      dateRange: {
        from,
        to,
        dateSlot,
      },
      measure,
      type,
      branchId,
    };

    const response = await axios.post('api/report/sales', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


export const fetchTopItems = async (limit?: null | number) => {
  const limitsize = limit ? `?limit=${limit}` : ''
  try {
    const response = await axios.get(`/api/report/top-items${limitsize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};



export const fetchTopCustomers = async () => {
  try {
    const limit = 10

    const formData: any = new FormData();

    formData.append('limit', limit);

    const response = await axios.post('api/report/top-customer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchRecentSales = async () => {
  try {
    const response = await axios.get('/api/report/recent-sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


export const fetchTopCategories = async () => {
  try {
    const response = await axios.get('/api/report/category-sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchTopFields = async (fromDate, toDate) => {
  try {
    const formattedFromDate = `${fromDate}T00:00:00.000Z`;
    const formattedToDate = `${toDate}T00:00:00.000Z`;

    const formData = new FormData();
    formData.append('fromDate', formattedFromDate);
    formData.append('toDate', formattedToDate);

    const response = await axios.post('/api/report/summary', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


export const fetchOrdersByYear = async (year) => {
  try {
    const formData = new FormData();
    formData.append('year', year);

    const response = await axios.post('/api/report/orders-by-year', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


export const fetchEndOfDaysData = async (page: number, size: number, sort: string, sortOrder: string, branchId: string | null = null, fromDate: string | null = null, toDate: string | null = null) => {
  const branchIdParam = branchId ? `branchId=${branchId}` : null
  const fromDateParam = fromDate ? `fromDate=${fromDate}` : null
  const toDateParam = toDate ? `toDate=${toDate}` : null
  try {
    const response = await axios.get(`/api/end-of-day?page=${page}&size=${size}&sort=${sort}&sortOrder=${sortOrder}&${branchIdParam}&${fromDateParam}&${toDateParam}`);
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


export const fetchRecentBills = async (page: number, size: number, eodId: string | null = null) => {
  try {
    const response = await axios.get(`/api/end-of-day/${eodId}/bills?page=${page}&size=${size}`);
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export const fetchFirstLastBills = async (eodId: string | null = null) => {
  try {
    const response = await axios.get(`/api/end-of-day/${eodId}/bills-summary`);
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// http://localhost:8080/api/report/summary?fromDate=2025-03-19T05%3A46%3A08.015Z&toDate=2025-03-21T05%3A45%3A38.424Z&branch=64d61d46d0931101a489e8ca&source=%3Cstring%3E%27

export const fetchRecentByDate = async (page: number, size: number, fromDate: string | null = null, toDate: string | null = null, branch: string | null = null, source: string | null = null) => {
  try {
    const response = await axios.get(`/api/report/recent-bills?page=${page}&size=${size}&fromDate=${fromDate}&toDate=${toDate}&branch=${branch ? branch : ''}&source=${source ? source : ''}`);

    return response;
  }
  catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}


// http://localhost:8080/api/report/bills-summary?branch=64d61d46d0931101a489e8ca&fromDate=2024-01-01T00%3A00%3A00.00Z&toDate=2024-11-10T00%3A00%3A00.00Z&page=0&size=60&source=null

export const fetchFirstLastBillsSummary = async (branch: string, source: string | null = null, fromDate: string | null = null, toDate: string | null = null) => {
  try {
    const response = await axios.get(`/api/report/bills-summary?branch=${branch ? branch : ''}&fromDate=${fromDate}&toDate=${toDate}&page=0&size=60&source=${source ? source : ''}`);

    return response;
  }
  catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

export const fetchStoreCreditReport = async ({
  fromDate,
  toDate,
  page,
  size,
}: {
  fromDate: string;
  toDate: string;
  page: number;
  size: number;
}) => {
  try {
    const response = await axios.get<IStoreCreditReportRow[]>(
      `/api/report/on-account?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&page=${page}&size=${size}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching store credit report:', error);
    throw error;
  }
};

export const fetchHouseChargesReport = async ({
  fromDate,
  toDate,
  branch,
}: {
  fromDate: string;
  toDate: string;
  branch: string | null;
}) => {
  try {
    const response = await axios.get<IHouseChargesReportRow[]>(
      `/api/report/house-charges?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&branch=${encodeURIComponent(branch ?? '')}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching house charges report:', error);
    throw error;
  }
};

export const fetchSalesActivitySummaryReport = async ({
  fromDate,
  toDate,
  branch,
}: {
  fromDate: string;
  toDate: string;
  branch: string;
}) => {
  try {
    const response = await axios.post<ISalesActivitySummaryReport>(
      `/api/report/sales-activity-summary?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&branch=${encodeURIComponent(branch)}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching sales activity summary report:', error);
    throw error;
  }
};
