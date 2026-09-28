export type WholesaleUserKind = 'salesManagers' | 'factoryUsers' | 'drivers';

export interface IWholesaleUser {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
  enabled?: boolean | null;
  role?: string | null;
  factoryIds?: string[];
}

/** Only sent when creating a user. */
export interface IWholesaleUserDraft extends IWholesaleUser {
  password?: string;
  temporaryPassword?: boolean;
}

export const USER_KINDS: { value: WholesaleUserKind; label: string; singular: string }[] = [
  { value: 'salesManagers', label: 'Sales managers', singular: 'sales manager' },
  { value: 'factoryUsers', label: 'Factory users', singular: 'factory user' },
  { value: 'drivers', label: 'Drivers', singular: 'driver' },
];

export const kindSingular = (kind: WholesaleUserKind) => USER_KINDS.find(k => k.value === kind)?.singular ?? 'user';

export const userName = (user?: IWholesaleUser | null) => [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || '';

export const newUser = (): IWholesaleUserDraft => ({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  temporaryPassword: true,
  factoryIds: [],
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UserErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'factoryIds', string>>;

export const validateUser = (user: IWholesaleUserDraft, kind: WholesaleUserKind): UserErrors => {
  const errors: UserErrors = {};
  if (!user.firstName?.trim()) errors.firstName = 'Enter the first name';
  else if (user.firstName.trim().length > 50) errors.firstName = 'Use at most 50 characters';
  if (!user.lastName?.trim()) errors.lastName = 'Enter the last name';
  else if (user.lastName.trim().length > 50) errors.lastName = 'Use at most 50 characters';
  if (!user.email?.trim() || !EMAIL.test(user.email.trim())) errors.email = 'Enter a valid email';
  if (!user.id && (user.password ?? '').length < 8) errors.password = 'Use at least 8 characters';
  if (kind === 'factoryUsers' && !user.factoryIds?.length) errors.factoryIds = 'Assign at least one factory';
  return errors;
};

/** Create sends the password; update only sends the editable fields. Factories are dropped for sales managers. */
export const toUserPayload = (user: IWholesaleUserDraft, kind: WholesaleUserKind): IWholesaleUserDraft => {
  const base = {
    firstName: user.firstName?.trim(),
    lastName: user.lastName?.trim(),
    email: user.email?.trim(),
    factoryIds: kind === 'factoryUsers' ? [...(user.factoryIds ?? [])] : [],
  };
  if (user.id) return base;
  return { ...base, username: user.username?.trim() || null, password: user.password, temporaryPassword: user.temporaryPassword !== false };
};
