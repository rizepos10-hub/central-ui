export interface IUserClock {
  branchId?: string;
  id?: string;
  instantClockedIn?: string;
  instantClockedOut?: string;
  deposit?: number | null;
  report?: string | null;
  username?: string;
}
export const defaultValue: Readonly<IUserClock> = {};
