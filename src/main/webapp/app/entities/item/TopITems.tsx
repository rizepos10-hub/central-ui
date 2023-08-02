import React from 'react';

const TopItems = () => {
  // Replace these dummy data with your real data from the backend or state management.
  const bestSellers = ['Product A', 'Product B', 'Product C'];
  const bestCustomers = ['Customer X', 'Customer Y', 'Customer Z'];
  const totalSales = '$10,000';

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
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h4 className="card-title">Best Sellers</h4>
              <ul className="list-group">
                {bestSellers.map((item, index) => (
                  <li key={index} className="list-group-item">
                    {item}
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
                {bestCustomers.map((item, index) => (
                  <li key={index} className="list-group-item">
                    {item}
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
