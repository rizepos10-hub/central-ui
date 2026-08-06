type SourceAppType = string | null | undefined;

const SOURCE_PREFIXES: Record<string, string> = {
  BRANCH_POS: 'BP',
  ONLINE_ORDERING: 'OO',
  AI_ORDERING: 'AI',
  CENTRAL_APP: 'AD',
  BUSINESS_ADMIN: 'AD',
  THIRD_PARTY: 'TP',
  MARKETPLACE: 'MP',
};

export const getOrderSourcePrefix = (sourceAppType?: SourceAppType) => {
  if (!sourceAppType) {
    return 'AD';
  }
  return SOURCE_PREFIXES[sourceAppType] || 'AD';
};

export const formatSourceScopedIdentifier = (
  sourceAppType: SourceAppType,
  sequenceNumber?: number | string | null,
  fallback?: string | null,
  padLength?: number
) => {
  if (sequenceNumber === null || sequenceNumber === undefined || sequenceNumber === '') {
    return fallback || '-';
  }

  const numericValue = String(sequenceNumber);
  const visibleNumber = padLength ? numericValue.padStart(padLength, '0') : numericValue;
  return `${getOrderSourcePrefix(sourceAppType)}-${visibleNumber}`;
};
