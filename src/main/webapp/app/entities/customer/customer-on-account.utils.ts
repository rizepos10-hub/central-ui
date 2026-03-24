import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';

export const omitGlobalOnAccountFields = (customer: ICustomer): ICustomer => {
  const { onAccountBalanceType, onAccountDebitLimit, branchOnAccountDebits, ...entity } = customer;
  return entity;
};
