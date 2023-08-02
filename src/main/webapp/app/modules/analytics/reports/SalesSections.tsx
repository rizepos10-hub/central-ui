import React from 'react';

const SalesSection = ({ title, data, isTotalSales = false }) => {
  const calculateTotal = (data) => {
    let total = 0;
    data.forEach((item) => {
      const value = parseFloat(item.value.replace('$', '').replace(',', ''));
      total += value;
    });
    return total.toFixed(2);
  };

  const formatTotalWithCommas = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="row mt-4">
      <div className="col-md-12">
        <div className={`p-3 border rounded ${isTotalSales ? "" : 'bg-light' } `}>
          <h3 className="mb-4">
            {title} <span className="text-sm" style={{ fontSize: '1rem' }}>| Total Sales</span>
          </h3>
          {data.map((item, index) => (
            <div className="d-flex justify-content-between mb-4" key={index}>
              <p>{item.label}</p>
              <p className="text-end">{item.value}</p>
            </div>
          ))}
          <hr />
          <div className="d-flex justify-content-between">
            <strong>NET SALES</strong>
            <p className="text-end">{`$ ${formatTotalWithCommas(calculateTotal(data))}`}</p>
          </div>
          <div className="d-flex justify-content-between">
            <strong>TOTAL TAX</strong>
            <p className="text-end">{`$ ${formatTotalWithCommas(calculateTotal(data))}`}</p>
          </div>
          <div className="d-flex justify-content-between">
            <strong>GROSS SALES</strong>
            <p className="text-end">{`$ ${formatTotalWithCommas(calculateTotal(data))}`}</p>
          </div>
          <div className="d-flex justify-content-between">
            <strong>TOTAL TIP</strong>
            <p className="text-end">{`$ ${formatTotalWithCommas(calculateTotal(data))}`}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesSection;
