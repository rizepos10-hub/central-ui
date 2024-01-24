import {useAppSelector} from "app/config/store";

export const formatPrice = (number, exchange) => {
  if (typeof number === 'number') {
    const formattedNumber = (number * (exchange?.rate || 1)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const currencySymbol = exchange?.currency;

    return `${formattedNumber} ${currencySymbol}`;
  }
};
