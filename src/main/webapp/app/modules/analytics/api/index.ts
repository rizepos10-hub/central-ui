import axios from 'axios';
import { IStoreCreditReportRow } from 'app/shared/model/store-credit-report.model';
import { IHouseChargesReportRow } from 'app/shared/model/house-charges-report.model';
import { ICommissionFeesReport } from 'app/shared/model/commission-fees-report.model';
import { ISalesActivitySummaryReport } from 'app/shared/model/sales-activity-summary-report.model';
import { IOptimizedProductSalesReport } from 'app/shared/model/optimized-product-sales-report.model';
import { ICashierByTerminalReport } from 'app/shared/model/cashier-by-terminal-report.model';



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


export const fetchTopItems = async (limit?: null | number, fromDate?: string | null, toDate?: string | null) => {
  const params = new URLSearchParams();
  if (limit) {
    params.set('limit', String(limit));
  }
  if (fromDate) {
    params.set('fromDate', `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    params.set('toDate', `${toDate}T00:00:00.000Z`);
  }
  const query = params.toString();
  try {
    const response = await axios.get(`/api/report/top-items${query ? `?${query}` : ''}`);
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

export const fetchRecentSales = async (fromDate?: string | null, toDate?: string | null) => {
  const params = new URLSearchParams();
  if (fromDate) {
    params.set('fromDate', `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    params.set('toDate', `${toDate}T00:00:00.000Z`);
  }
  const query = params.toString();
  try {
    const response = await axios.get(`/api/report/recent-sales${query ? `?${query}` : ''}`);
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

export const fetchTopFields = async (fromDate?: string | null, toDate?: string | null) => {
  try {
    const formData = new FormData();
    if (fromDate) {
      formData.append('fromDate', `${fromDate}T00:00:00.000Z`);
    }
    if (toDate) {
      formData.append('toDate', `${toDate}T00:00:00.000Z`);
    }

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
  try {
    const params = new URLSearchParams({
      page: `${page}`,
      size: `${size}`,
      sort,
      sortOrder,
    });

    if (branchId) {
      params.set('branchId', branchId);
    }

    if (fromDate) {
      params.set('fromDate', fromDate);
    }

    if (toDate) {
      params.set('toDate', toDate);
    }

    const response = await axios.get(`/api/end-of-day?${params.toString()}`);
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
    const params = new URLSearchParams({
      page: `${page}`,
      size: `${size}`,
    });

    if (fromDate) {
      params.set('fromDate', fromDate);
    }

    if (toDate) {
      params.set('toDate', toDate);
    }

    if (branch) {
      params.set('branch', branch);
    }

    if (source) {
      params.set('source', source);
    }

    const response = await axios.get(`/api/report/recent-bills?${params.toString()}`);

    return response;
  }
  catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}


// http://localhost:8080/api/report/bills-summary?branch=64d61d46d0931101a489e8ca&fromDate=2024-01-01T00%3A00%3A00.00Z&toDate=2024-11-10T00%3A00%3A00.00Z&page=0&size=60&source=null

export const fetchFirstLastBillsSummary = async (branch: string | null = null, source: string | null = null, fromDate: string | null = null, toDate: string | null = null) => {
  try {
    const params = new URLSearchParams({
      page: '0',
      size: '60',
    });

    if (branch) {
      params.set('branch', branch);
    }

    if (fromDate) {
      params.set('fromDate', fromDate);
    }

    if (toDate) {
      params.set('toDate', toDate);
    }

    if (source) {
      params.set('source', source);
    }

    const response = await axios.get(`/api/report/bills-summary?${params.toString()}`);

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
  onAccountEnabled,
  accountNumber,
  page,
  size,
}: {
  fromDate?: string | null;
  toDate?: string | null;
  onAccountEnabled?: boolean | null;
  accountNumber?: string | null;
  page: number;
  size: number;
}) => {
  try {
    const params = new URLSearchParams({
      page: `${page}`,
      size: `${size}`,
    });

    if (fromDate) {
      params.set('fromDate', fromDate);
    }

    if (toDate) {
      params.set('toDate', toDate);
    }

    if (onAccountEnabled === true) {
      params.set('onAccountEnabled', 'true');
    }

    if (accountNumber) {
      params.set('accountNumber', accountNumber);
    }

    const response = await axios.get<IStoreCreditReportRow[]>(`/api/report/on-account?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching store credit report:', error);
    throw error;
  }
};

export const fetchOnAccountTotalBalance = async () => {
  try {
    const response = await axios.get<{ totalBalance: number }>('/api/report/on-account/total-balance');
    return response.data;
  } catch (error) {
    console.error('Error fetching on-account total balance:', error);
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
    const params = new URLSearchParams({
      fromDate,
      toDate,
    });

    if (branch) {
      params.set('branch', branch);
    }

    const response = await axios.get<IHouseChargesReportRow[]>(`/api/report/house-charges?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching house charges report:', error);
    throw error;
  }
};

export const fetchCommissionFeesReport = async ({
  fromDate,
  toDate,
  branch,
}: {
  fromDate: string;
  toDate: string;
  branch: string;
}) => {
  try {
    const params = new URLSearchParams({
      fromDate,
      toDate,
      branch,
    });

    const response = await axios.post<ICommissionFeesReport>(`/api/report/commission-fees?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching commission fees report:', error);
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
  branch: string | null;
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

export const fetchOptimizedProductSalesReport = async ({
  fromDate,
  toDate,
  branch,
  source,
  registryId,
  tillId,
  username,
}: {
  fromDate: string;
  toDate: string;
  branch: string | null;
  source: string | null;
  registryId: string | null;
  tillId: string | null;
  username: string | null;
}) => {
  try {
    const params = new URLSearchParams({
      fromDate,
      toDate,
    });

    if (branch) {
      params.set('branch', branch);
    }

    if (source) {
      params.set('source', source);
    }

    if (registryId) {
      params.set('registryId', registryId);
    }

    if (tillId) {
      params.set('tillId', tillId);
    }

    if (username) {
      params.set('username', username);
    }

    const response = await axios.post<IOptimizedProductSalesReport>(
      `/api/report/items/optimized-sales?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching optimized product sales report:', error);
    throw error;
  }
};

export const fetchCashierByTerminalReport = async ({
  fromDate,
  toDate,
  branch,
  source,
  tillId,
  username,
}: {
  fromDate: string;
  toDate: string;
  branch: string | null;
  source: string | null;
  tillId: string | null;
  username: string | null;
}) => {
  try {
    const params = new URLSearchParams({
      fromDate,
      toDate,
    });

    if (branch) {
      params.set('branch', branch);
    }

    if (source) {
      params.set('source', source);
    }

    if (tillId) {
      params.set('tillId', tillId);
    }

    if (username) {
      params.set('username', username);
    }

    const response = await axios.post<ICashierByTerminalReport>(`/api/report/cashier-by-terminal?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cashier by terminal report:', error);
    throw error;
  }
};
