import React, { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { useNavigate, useParams } from 'react-router-dom';
import { getEntity } from './order.reducer';
import { getEntity as getSettings } from 'app/entities/online-ordering/settings/settings.reducer';
// @ts-expect-error -- ignore
import styles from './print-order.module.css';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { IUiSettings } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { ServiceChargeKey } from 'app/shared/model/service-charge.model';

type DiscountLike = {
  value?: number | null;
  type?: 'PERCENTAGE' | 'FLAT' | string;
} | null | undefined;

interface IInvoiceLine {
  id: string;
  quantity: number;
  itemCode: string;
  description: string;
  unit: string;
  unitPrice: number;
  discountText: string;
  netPrice: number;
  extPrice: number;
  po: string;
  taxCode: string;
  isAddon: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const toNumber = (value?: number | null): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCurrency = (value?: number | null): string => currencyFormatter.format(toNumber(value));

const toQuantity = (value?: number | null): string => quantityFormatter.format(toNumber(value));

const splitLines = (value?: string | null): string[] =>
  (value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatInvoiceDate = (value?: string | null): string => {
  const parsed = parseDate(value);
  if (!parsed) {
    return '-';
  }

  return parsed.toLocaleDateString('en-CA').replace(/-/g, '/');
};

const formatInvoiceTime = (value?: string | null): string => {
  const parsed = parseDate(value);
  if (!parsed) {
    return '-';
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const getDiscountMeta = (discount: DiscountLike, baseAmount: number): { text: string; amount: number } => {
  if (!discount || discount.value == null) {
    return { text: '-', amount: 0 };
  }

  const discountValue = toNumber(discount.value);
  if (discount.type === 'PERCENTAGE') {
    return {
      text: `${discountValue}%`,
      amount: (baseAmount * discountValue) / 100,
    };
  }

  return {
    text: toCurrency(discountValue),
    amount: discountValue,
  };
};

const formatAddressLines = (address?: {
  fullAddress?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null): string[] => {
  if (!address) {
    return [];
  }

  if (address.fullAddress) {
    return splitLines(address.fullAddress);
  }

  if (address.address) {
    return splitLines(address.address);
  }

  const streetLine = [address.street].filter(Boolean).join(' ');
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(' ');
  return [streetLine, cityLine, address.country].filter(Boolean);
};

const PrintOrder = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handlePrint = useReactToPrint({
    content: () => ref.current,
    pageStyle: '@page { size: A4 portrait; margin: 0; }',
  });

  const { id } = useParams<'id'>();
  const dispatch = useAppDispatch();

  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);

  useEffect(() => {
    if (id) {
      dispatch(getEntity(id));
    }
    dispatch(getSettings());
  }, [dispatch, id]);

  const logoUrl = useMemo(() => {
    return uiSettings?.logo?.image?.url || uiSettings?.logo?.image?.path || (uiSettings as any)?.logo?.url || '';
  }, [uiSettings]);

  const invoiceLines = useMemo<IInvoiceLine[]>(() => {
    const rows: IInvoiceLine[] = [];

    (orderEntity?.items || []).forEach((item, itemIndex) => {
      const quantity = toNumber(item.amount);
      const unitPrice = toNumber(item.price);
      const baseAmount = quantity * unitPrice;
      const discountMeta = getDiscountMeta(item.discount, baseAmount);
      const netPrice = quantity > 0 ? Math.max(0, unitPrice - discountMeta.amount / quantity) : unitPrice;
      const extPrice = item.total != null ? toNumber(item.total) : Math.max(0, baseAmount - discountMeta.amount);

      rows.push({
        id: `item-${item.id || itemIndex}`,
        quantity,
        itemCode: item.itemId || item.id?.slice(-6)?.toUpperCase() || `ITM-${itemIndex + 1}`,
        description: [item.itemName, item.variantName].filter(Boolean).join(' ') || 'Item',
        unit: 'UNIT',
        unitPrice,
        discountText: discountMeta.text,
        netPrice,
        extPrice,
        po: '-',
        taxCode: toNumber(item.taxValue) > 0 ? 'T' : '-',
        isAddon: false,
      });

      (item.addons || []).forEach((addon, addonIndex) => {
        const addonQuantity = toNumber(addon.amount);
        const addonUnitPrice = toNumber(addon.price);
        const addonBaseAmount = addonQuantity * addonUnitPrice;
        const addonDiscount = getDiscountMeta(addon.discount, addonBaseAmount);
        const addonNetPrice =
          addonQuantity > 0 ? Math.max(0, addonUnitPrice - addonDiscount.amount / addonQuantity) : addonUnitPrice;
        const addonExtPrice =
          addon.total != null ? toNumber(addon.total) : Math.max(0, addonBaseAmount - addonDiscount.amount);

        rows.push({
          id: `addon-${item.id || itemIndex}-${addon.id || addonIndex}`,
          quantity: addonQuantity,
          itemCode: addon.id?.slice(-6)?.toUpperCase() || `ADD-${addonIndex + 1}`,
          description: `+ ${addon.name || 'Addon'}`,
          unit: 'UNIT',
          unitPrice: addonUnitPrice,
          discountText: addonDiscount.text,
          netPrice: addonNetPrice,
          extPrice: addonExtPrice,
          po: '-',
          taxCode: toNumber(addon.taxValue) > 0 ? 'T' : '-',
          isAddon: true,
        });
      });
    });
    return rows;
  }, [orderEntity]);

  const amountPaid = useMemo(() => {
    return (orderEntity?.bills || []).reduce((sum, bill) => sum + toNumber(bill.total), 0);
  }, [orderEntity?.bills]);

  const shippingAmount = useMemo(() => {
    return (orderEntity?.orderCharges || []).reduce((sum, charge) => {
      if (charge.chargeType === ServiceChargeKey.SHIPPING_FEE) {
        return sum + toNumber(charge.amount);
      }
      return sum;
    }, 0);
  }, [orderEntity?.orderCharges]);

  const orderTotal = toNumber(orderEntity?.total);
  const taxAmount = toNumber(orderEntity?.totalTaxes);
  const discountAmount = toNumber(orderEntity?.totalDiscount);
  const subtotalAmount = Math.max(0, orderTotal - taxAmount - shippingAmount);
  const taxableAmount = Math.max(0, subtotalAmount);
  const balanceDue = Math.max(0, orderTotal - amountPaid);

  const customerDisplayName =
    orderEntity?.customer?.businessDetails?.businessName ||
    [orderEntity?.customer?.firstName, orderEntity?.customer?.lastName].filter(Boolean).join(' ') ||
    'Walk-in Customer';

  const soldToAddress =
    formatAddressLines(orderEntity?.customer?.deliveryAddresses?.[0]) ||
    formatAddressLines(orderEntity?.deliverTo) ||
    [];
  const shipToAddress = formatAddressLines(orderEntity?.deliverTo) || soldToAddress;

  const soldToLines = [
    customerDisplayName,
    ...soldToAddress,
    orderEntity?.customer?.phone ? `Phone ${orderEntity.customer.phone}` : '',
  ].filter(Boolean);

  const shipToLines = [
    customerDisplayName,
    ...(shipToAddress.length ? shipToAddress : soldToAddress),
    orderEntity?.deliverTo?.phoneNumber
      ? `Phone ${orderEntity.deliverTo.phoneNumber}`
      : orderEntity?.customer?.phone
      ? `Phone ${orderEntity.customer.phone}`
      : '',
  ].filter(Boolean);

  const paymentTransactions = (orderEntity?.bills || []).flatMap(bill => bill.paymentTransactions || []);
  const paymentMethodName =
    paymentTransactions[0]?.method?.name || paymentTransactions[0]?.type || paymentTransactions[0]?.description || 'Other';
  const paymentLine = `${paymentMethodName}:$${toCurrency(orderTotal)}`;

  const companyInfoLines = [
    ...splitLines(uiSettings?.address),
    uiSettings?.phoneNumber,
    uiSettings?.email,
  ].filter(Boolean);

  const invoiceNumber = orderEntity?.sequenceNumber ? `${orderEntity.sequenceNumber}`.padStart(7, '0') : '-';
  const poNumber = orderEntity?.id ? orderEntity.id.slice(-5).toUpperCase() : '-';

  return (
    <div>
      <div className={styles.printWrapper}>
        <div ref={ref} className={styles.sheet}>
          <div className={styles.topRow}>
            <div className={styles.companyBlock}>
              <div className={styles.companyName}>{uiSettings?.applicationName || 'Company Name'}</div>
              {companyInfoLines.map((line, index) => (
                <div key={`company-line-${index}`} className={styles.companyMeta}>
                  {line}
                </div>
              ))}
            </div>
            <div className={styles.invoiceTitle}>INVOICE</div>
            <div className={styles.logoBlock}>{logoUrl && <img src={logoUrl} alt="Company logo" className={styles.logo} />}</div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <div className={styles.metaHeading}>SOLD TO</div>
              {soldToLines.map((line, index) => (
                <div key={`sold-to-${index}`} className={styles.metaText}>
                  {line}
                </div>
              ))}
            </div>
            <div className={styles.metaCard}>
              <div className={styles.metaHeading}>SHIP TO</div>
              {shipToLines.map((line, index) => (
                <div key={`ship-to-${index}`} className={styles.metaText}>
                  {line}
                </div>
              ))}
            </div>
            <div className={styles.metaCard}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>INVOICE#:</span>
                <span>{invoiceNumber}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>DATE:</span>
                <span>{formatInvoiceDate(orderEntity?.createdDate)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>TIME:</span>
                <span>{formatInvoiceTime(orderEntity?.createdDate)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>PO#:</span>
                <span>{poNumber}</span>
              </div>
            </div>
          </div>

          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>QTY</th>
                <th>ITEM #</th>
                <th>DESCRIPTION</th>
                <th>U/M</th>
                <th className={styles.textRight}>PRICE</th>
                <th className={styles.textRight}>DISCOUNT</th>
                <th className={styles.textRight}>NET PRIC</th>
                <th className={styles.textRight}>EXT PRIC</th>
                <th className={styles.textCenter}>PO</th>
                <th className={styles.textCenter}>TAX</th>
              </tr>
            </thead>
            <tbody>
              {invoiceLines.map(row => (
                <tr key={row.id} className={row.isAddon ? styles.addonRow : ''}>
                  <td>{toQuantity(row.quantity)}</td>
                  <td>{row.itemCode}</td>
                  <td>{row.description}</td>
                  <td>{row.unit}</td>
                  <td className={styles.textRight}>{toCurrency(row.unitPrice)}</td>
                  <td className={styles.textRight}>{row.discountText}</td>
                  <td className={styles.textRight}>{toCurrency(row.netPrice)}</td>
                  <td className={styles.textRight}>{toCurrency(row.extPrice)}</td>
                  <td className={styles.textCenter}>{row.po}</td>
                  <td className={styles.textCenter}>{row.taxCode}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.footerGrid}>
            <div className={styles.signatureBox}>SIGNATURE:_______________________</div>
            <table className={styles.footerTable}>
              <thead>
                <tr>
                  <th>PAYMENT</th>
                  <th className={styles.textRight}>TENDERED</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{paymentLine}</td>
                  <td className={styles.textRight}>{toCurrency(amountPaid)}</td>
                </tr>
              </tbody>
            </table>
            <table className={styles.footerTable}>
              <tbody>
                <tr>
                  <td>DISCOUNTS</td>
                  <td className={styles.textRight}>{toCurrency(discountAmount)}</td>
                </tr>
                <tr>
                  <td>TAXABLE</td>
                  <td className={styles.textRight}>{toCurrency(taxableAmount)}</td>
                </tr>
                <tr>
                  <td>NON-TAXABLE</td>
                  <td className={styles.textRight}>0.00</td>
                </tr>
                <tr>
                  <td>SUBTOTAL</td>
                  <td className={styles.textRight}>{toCurrency(subtotalAmount)}</td>
                </tr>
                <tr>
                  <td>SHIPPING</td>
                  <td className={styles.textRight}>{toCurrency(shippingAmount)}</td>
                </tr>
                <tr>
                  <td>TAX AMOUNT</td>
                  <td className={styles.textRight}>{toCurrency(taxAmount)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>TOTAL</td>
                  <td className={styles.textRight}>{toCurrency(orderTotal)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>BALANCE DUE</td>
                  <td className={styles.textRight}>{toCurrency(balanceDue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end mb-5">
        <Button onClick={() => navigate(`/order/${orderEntity?.id}`)}>Back</Button>
        <Button onClick={handlePrint}>Print</Button>
      </div>
    </div>
  );
};

export default PrintOrder;
