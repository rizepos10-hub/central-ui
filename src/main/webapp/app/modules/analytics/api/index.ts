import axios from 'axios';

export const fetchTopItems = async (limit?: null | number) => {
  const limitsize = limit?`?limit=${limit}` : ''
  try {
    const response = await axios.get(`/api/orders/top/items${limitsize}`);
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
console.log(response, 'resss')
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};


