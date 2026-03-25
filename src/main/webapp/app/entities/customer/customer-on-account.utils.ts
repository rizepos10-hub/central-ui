import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';

export const omitGlobalOnAccountFields = (customer: ICustomer): ICustomer => {
  const { onAccountBalanceType, ...entity } = customer;
  return entity;
};
