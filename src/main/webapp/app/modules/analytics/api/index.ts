import axios from 'axios';

export const fetchTopItems = async () => {
  try {
    const response = await axios.get('/api/orders/top/items');
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
