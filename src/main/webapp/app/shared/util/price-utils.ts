import {useAppSelector} from "app/config/store";

export const formatPrice = (number, exchange) => {
  if (typeof number === 'number') {
    const formattedNumber = (number * (exchange?.rate || 1)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const currencySymbol = exchange?.currency?.code || exchange?.code;
    return `${formattedNumber} ${currencySymbol}`;
  }
};

// format 1000 to 1,000
export const formatNumber = (number: number) => {
  return number?.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};