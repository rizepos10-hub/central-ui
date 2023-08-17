import React, { useEffect, useState } from 'react';
import { fetchTopCustomers, fetchTopItems } from 'app/modules/analytics/api';

const TopItems = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [bestCustomers, setBestCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const topItemsData = await fetchTopItems();
      setBestSellers(topItemsData);

      const topCustomersData = await fetchTopCustomers();
      setBestCustomers(topCustomersData);
    };
    fetchData();
  }, []);

  return (
    <div className="container mt-5" >
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow" >
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
                        src={
                          item?.variantAttachments && item?.variantAttachments.length > 0
                            ? item?.variantAttachments[0]?.url
                            : item?.itemAttachments && item?.itemAttachments.length > 0
                              ? item?.itemAttachments[0]?.url
                              : null
                        }
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
                {bestCustomers &&
                  bestCustomers.map((customer, index) => (
                    <li key={index} className="list-group-item d-flex align-items-center mb-3">
                      <div className="d-flex flex-grow-1 align-items-center">
                        <div className="me-3 d-flex flex-column">
                          <strong>Customer Name</strong> {customer?.firstName} {customer?.lastName}
                        </div>
                        <div className="me-3 d-flex flex-column">
                          <strong>Orders</strong> {customer?.count}
                        </div>
                        <div className="me-3 d-flex flex-column text-center">
                          <strong>Phone Number</strong> {customer?.phone}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopItems;
