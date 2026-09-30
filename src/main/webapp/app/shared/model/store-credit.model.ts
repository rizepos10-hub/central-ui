export type StoreCreditEntryType = 'ISSUE' | 'REFUND' | 'REDEMPTION' | 'REVERSAL' | 'EXPIRY' | 'ADJUSTMENT';

export const STORE_CREDIT_ENTRY_LABELS: Record<StoreCreditEntryType, string> = {
  ISSUE: 'Issued',
  REFUND: 'Refund',
  REDEMPTION: 'Redeemed',
  REVERSAL: 'Reversal',
  EXPIRY: 'Expired',
  ADJUSTMENT: 'Adjustment',
};

export interface StoreCreditEntry {
  id: string;
  customerId: string;
  type: StoreCreditEntryType;
  amount: number;
  remaining?: number | null;
  expiresAt?: string | null;
  expired?: boolean;
  balanceAfter?: number | null;
  branchId?: string | null;
  billSequenceNumber?: number | null;
  online?: boolean;
  userName?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
}

export interface StoreCreditBalance {
  customerId: string;
  balance: number;
  nextExpiryAt?: string | null;
  nextExpiryAmount?: number | null;
}

export interface StoreCreditSetting {
  enabled: boolean;
  defaultExpiryDays?: number | null;
  redeemableOnline: boolean;
}

export interface BranchStoreCreditSetting {
  branchId: string;
  branchName?: string | null;
  value: StoreCreditSetting;
}
