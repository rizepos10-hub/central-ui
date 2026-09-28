export interface IBranchRef {
  id: string;
  name?: string | null;
}

export interface ISalesman {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
  enabled?: boolean | null;
  branches?: IBranchRef[];
}

/** Only sent when creating a salesman, or when resetting the password. */
export interface ISalesmanDraft extends ISalesman {
  password?: string;
  temporaryPassword?: boolean;
}

export interface ICustomerAssignment {
  id: string;
  salesmanId: string;
  customerId: string;
}

export interface ICategoryAssignment {
  id: string;
  salesmanId: string;
  categoryId: string;
  categoryName?: string | null;
}

export interface IAssignableCategory {
  id: string;
  name?: string | null;
}

export interface IAssignedCustomer {
  assignmentId: string;
  customerId: string;
  name: string;
  accountNumber?: string | null;
}

export const salesmanName = (salesman?: ISalesman | null) =>
  [salesman?.firstName, salesman?.lastName].filter(Boolean).join(' ').trim() || salesman?.username || '';

export const newSalesman = (): ISalesmanDraft => ({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  temporaryPassword: true,
  branches: [],
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SalesmanErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password', string>>;

export const validateSalesman = (salesman: ISalesmanDraft): SalesmanErrors => {
  const errors: SalesmanErrors = {};
  if (!salesman.firstName?.trim()) errors.firstName = 'Enter the first name';
  else if (salesman.firstName.trim().length > 50) errors.firstName = 'Use at most 50 characters';
  if (!salesman.lastName?.trim()) errors.lastName = 'Enter the last name';
  else if (salesman.lastName.trim().length > 50) errors.lastName = 'Use at most 50 characters';
  if (!salesman.email?.trim() || !EMAIL.test(salesman.email.trim())) errors.email = 'Enter a valid email';
  const password = salesman.password ?? '';
  if ((!salesman.id || password) && password.length < 8) errors.password = 'Use at least 8 characters';
  return errors;
};

/**
 * Update replaces the branches, so they are always sent. The password is sent on create, and on update only when a
 * new one was typed.
 */
export const toSalesmanPayload = (salesman: ISalesmanDraft): ISalesmanDraft => {
  const payload: ISalesmanDraft = {
    firstName: salesman.firstName?.trim(),
    lastName: salesman.lastName?.trim(),
    email: salesman.email?.trim(),
    branches: (salesman.branches ?? []).map(b => ({ id: b.id })),
  };
  if (!salesman.id) payload.username = salesman.username?.trim() || null;
  if (!salesman.id || salesman.password) {
    payload.password = salesman.password;
    payload.temporaryPassword = salesman.temporaryPassword !== false;
  }
  return payload;
};

/** Customer DTOs come from the generic customer endpoint, where the business name is nested. */
export const assignedCustomerName = (customer: any, fallback: string) => {
  const person = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim();
  return customer?.businessDetails?.businessName || customer?.businessName || person || fallback;
};
