import { FilterMatchMode } from 'primereact/api';

const CUSTOMER_SEARCH_FIELDS = ['firstName', 'lastName', 'businessDetails.businessName'] as const;

type CustomerSearchConstraint = {
  field: typeof CUSTOMER_SEARCH_FIELDS[number];
  value: string;
  matchMode: FilterMatchMode;
};

type CustomerSearchGroup = {
  operator: 'OR';
  constraints: CustomerSearchConstraint[];
};

export const buildCustomerSearchGroups = (rawValue?: string | null): CustomerSearchGroup[] => {
  const normalizedValue = rawValue ?? '';
  if (!normalizedValue.trim()) {
    return [];
  }

  return [
    {
      operator: 'OR',
      constraints: CUSTOMER_SEARCH_FIELDS.map(field => ({
        field,
        value: normalizedValue,
        matchMode: FilterMatchMode.CONTAINS,
      })),
    },
  ];
};

export const getCustomerSearchValueFromGroups = (groups?: Array<{ constraints?: Array<{ field?: string; value?: unknown }> }> | null): string => {
  if (!Array.isArray(groups)) {
    return '';
  }

  const matchingConstraint = groups
    .flatMap(group => group?.constraints || [])
    .find(constraint => constraint?.field === 'firstName' && typeof constraint.value === 'string');

  return typeof matchingConstraint?.value === 'string' ? matchingConstraint.value : '';
};
