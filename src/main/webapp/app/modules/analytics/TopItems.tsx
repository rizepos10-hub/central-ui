import React, {useEffect, useState} from 'react';
import axios from "axios";

const TopItems = () => {

  const [bestSellers, setBestSellers] = useState([]);
  const [bestCustomers, setBestCustomers] = useState([]);
  const [totalSales, setTotalSales] = useState('');



  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/orders/top/items`);
        setBestSellers(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);


  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-lg-12 mb-4 d-flex justify-content-center">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title align-middle text-center">Total Sales</h2>
              <p className="card-text display-4 ">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-12 mb-4">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h4 className="card-title">Best Sellers</h4>
              <ul className="list-group">
                {bestSellers &&
                  bestSellers.map((item, index) => (
                    <li key={index} className="list-group-item d-flex align-items-center mb-3">
                      <div className="d-flex flex-grow-1 align-items-center">
                        <div className="me-3 d-flex flex-column">
                          <strong>Item Name</strong> {item?.itemName || 'No Name'}
                        </div>
                        <div className="me-3 d-flex flex-column">
                          <strong>Variant Name</strong> {item?.variantName || 'No Variant Name'}
                        </div>
                        <div className="me-3 d-flex flex-column text-center">
                          <strong>Order Count</strong> {item?.orderCount}
                        </div>
                      </div>
                      <img
                        src={item?.variantAttachments && item?.variantAttachments[0]?.url || 'default-image-url'}
                        alt="Best Seller"
                        style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                      />
                    </li>
                  ))}
              </ul>

            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h4 className="card-title">Best Customers</h4>
              <ul className="list-group">
                {/* {bestCustomers.map((item, index) => ( */}
                {/*   <li key={index} className="list-group-item"> */}
                {/*     {item} */}
                {/*   </li> */}
                {/* ))} */}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopItems;
