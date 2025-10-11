import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { formatPrice } from 'app/shared/util/price-utils';
import { Translate } from "react-jhipster";
import { getEntity as getCurrencySettings } from 'app/entities/settings/currency/currency-settings.reducer';
import { Separator } from '@/components/ui/separator';

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
    <div className="mt-2">
      <div className={`p-2 border rounded-lg text-xs ${!isTotalSales ? 'bg-muted/30' : ''}`}>
        <h3 className="mb-2 text-sm font-semibold">
          {title} {!isTotalSales && <span className="text-xs font-normal text-muted-foreground">| Total Sales</span>}
        </h3>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.orders'}>Orders</Translate></span>
          <span className="text-right">{data?.orders ?? 0}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.subtotal'}>Subtotal</Translate></span>
          <span className="text-right">{formatPrice(data?.subTotal ?? 0, exchange)}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.discount'}>Discount</Translate></span>
          <span className="text-right">{data?.discount ?? 0} %</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.coupon'}>Applied Coupon</Translate></span>
          <span className="text-right">{formatPrice(data?.appliedCoupon ?? 0, exchange)}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.d-charge'}>Delivery Charge</Translate></span>
          <span className="text-right">{formatPrice(data?.deliveryCharge ?? 0, exchange)}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.d-tax'}>Delivery TAX</Translate></span>
          <span className="text-right">{formatPrice(data?.deliveryTAX ?? 0, exchange)}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.refunds'}>Refunds</Translate></span>
          <span className="text-right">{formatPrice(data?.refunds ?? 0, exchange)}</span>
        </div>

        <div className="flex justify-between mb-1.5">
          <span><Translate contentKey={'analytics.report.gst'}>Gst</Translate></span>
          <span className="text-right">{data?.gst ?? 0}</span>
        </div>

        <div className="flex justify-between mb-2">
          <span><Translate contentKey={'analytics.report.hst'}>Hst</Translate></span>
          <span className="text-right">{data?.hst ?? 0}</span>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between mb-1">
          <strong><Translate contentKey={'analytics.report.netSales'}>NET SALES</Translate></strong>
          <strong>{formatPrice(data?.netSales ?? 0, exchange)}</strong>
        </div>

        <div className="flex justify-between mb-1">
          <strong><Translate contentKey={'analytics.report.totalTax'}>TOTAL TAX</Translate></strong>
          <strong>{formatPrice(data?.totalTAX ?? 0, exchange)}</strong>
        </div>

        <div className="flex justify-between mb-1">
          <strong><Translate contentKey={'analytics.report.grossSales'}>GROSS SALES</Translate></strong>
          <strong>{formatPrice(data?.grossSales ?? 0, exchange)}</strong>
        </div>

        <div className="flex justify-between">
          <strong><Translate contentKey={'analytics.report.totalTip'}>TOTAL TIP</Translate></strong>
          <strong>{formatPrice(data?.totalTip ?? 0, exchange)}</strong>
        </div>
      </div>
    </div>
  );
};

export default SalesSection;
