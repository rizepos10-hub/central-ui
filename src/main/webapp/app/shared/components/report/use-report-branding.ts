import { useEffect, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBusinessDetails } from 'app/entities/settings/business-details/business-detail.reducer';
import { IAttachment } from 'app/shared/model/attachment.model';
import { IBusinessDetail } from 'app/shared/model/business-detail.model';

export const resolveReportLogoUrl = (logo?: IAttachment | null) => logo?.url || logo?.path || '';

export const getPrimaryBusinessDetail = (businessDetails?: IBusinessDetail[] | null) => businessDetails?.[0] || null;

export const useReportBranding = () => {
  const dispatch = useAppDispatch();
  const businessDetails = useAppSelector(state => state.businessDetail.entities);
  const loading = useAppSelector(state => state.businessDetail.loading);

  useEffect(() => {
    if (!loading && businessDetails.length === 0) {
      dispatch(getBusinessDetails({}));
    }
  }, [businessDetails.length, dispatch, loading]);

  return useMemo(() => {
    const businessDetail = getPrimaryBusinessDetail(businessDetails);

    return {
      businessDetail,
      businessName: businessDetail?.businessName || '',
      logoUrl: resolveReportLogoUrl(businessDetail?.logo),
    };
  }, [businessDetails]);
};
