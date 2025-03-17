import axios from 'axios';



// api/report/sales

export const fetchSalesReport = async ({ dateRange, measure, type }) => {
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
