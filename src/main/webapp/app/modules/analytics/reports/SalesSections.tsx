import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { formatPrice } from 'app/shared/util/price-utils';
import { Translate } from "react-jhipster";
import { getEntity as getCurrencySettings } from 'app/entities/settings/currency/currency-settings.reducer';

const SalesSection = ({ title, data, isTotalSales = false }) => {
  const dispatch = useAppDispatch();

  const currencySettingsEntity = useAppSelector(state => state.currencySettings.entity);
  const displayCurrency = currencySettingsEntity?.displayCurrency || currencySettingsEntity?.defaultCurrency;
  const exchangeRatesArray = currencySettingsEntity?.exchangeRates || [];
  const exchange =
    exchangeRatesArray?.find(exRate => {
      return exRate?.currency?.code === displayCurrency?.code;
    }) || currencySettingsEntity.defaultCurrency;

  useEffect(() => {
    dispatch(getCurrencySettings());
  }, [])

  return (
    <div className="row mt-4">
      <div className="col-md-12">
        <div className={`p-3 border rounded ${isTotalSales ? "" : 'bg-light'}`}>
          <h3 className="mb-4">
            {title} <span className="text-sm" style={{ fontSize: '1rem' }}>{!isTotalSales ? "| Total Sales" : ""}</span>
          </h3>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.orders'}>Orders</Translate></p>
            <p className="text-end">
              {data?.orders ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.subtotal'}>Subtotal</Translate></p>
            <p className="text-end">
              {formatPrice(data?.subTotal ?? 0, exchange)}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.discount'}>Discount</Translate></p>
            <p className="text-end">
              {data?.discount ?? 0} %
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.coupon'}>Applied Coupon</Translate></p>
            <p className="text-end">
              {formatPrice(data?.appliedCoupon ?? 0, exchange)}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.d-charge'}>Delivery Charge</Translate></p>
            <p className="text-end">
              {formatPrice(data?.deliveryCharge ?? 0, exchange)}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.d-tax'}>Delivery TAX</Translate></p>
            <p className="text-end">
              {formatPrice(data?.deliveryTAX ?? 0, exchange)}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.refunds'}>Refunds</Translate></p>
            <p className="text-end">
              {formatPrice(data?.refunds ?? 0, exchange)}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.gst'}>Gst</Translate></p>
            <p className="text-end">
              {data?.gst ?? 0}
            </p>
          </div>
          <div className="d-flex justify-content-between mb-4">
            <p><Translate contentKey={'analytics.report.hst'}>Hst</Translate></p>
            <p className="text-end">
              {data?.hst ?? 0}
            </p>
          </div>


          <hr />
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.report.netSales'}>NET SALES</Translate></strong>
            {formatPrice(data?.netSales ?? 0, exchange)}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.report.totalTax'}>TOTAL TAX</Translate></strong>
            {formatPrice(data?.totalTAX ?? 0, exchange)}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.report.grossSales'}>GROSS SALES</Translate></strong>
            {formatPrice(data?.grossSales ?? 0, exchange)}
          </div>
          <div className="d-flex justify-content-between">
            <strong><Translate contentKey={'analytics.report.totalTip'}>TOTAL TIP</Translate></strong>
            {formatPrice(data?.totalTip ?? 0, exchange)}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SalesSection;
