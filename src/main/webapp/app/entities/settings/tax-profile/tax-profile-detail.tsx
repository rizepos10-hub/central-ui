import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { ArrowLeft, Pencil } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity } from './tax-profile.reducer';
import { Button } from '@/components/ui/button';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const TaxProfileDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const taxProfileEntity = useAppSelector(state => state.taxProfiles.entity);

  return (
    <PageWrapper>
      <div className="space-y-4 max-w-3xl">
        <h2 data-cy="taxDetailsHeading" className="text-base font-bold">
          <Translate contentKey="tempApp.tax.detail.title">Tax Profile</Translate>
        </h2>

        <div className="space-y-3 border rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 py-2 border-b">
            <dt className="text-xs font-semibold">
              <Translate contentKey="global.field.id">ID</Translate>
            </dt>
            <dd className="col-span-2 text-xs">{taxProfileEntity.id}</dd>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b">
            <dt className="text-xs font-semibold">
              <Translate contentKey="tempApp.tax.name">Name</Translate>
            </dt>
            <dd className="col-span-2 text-xs">{taxProfileEntity.name}</dd>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b">
            <dt className="text-xs font-semibold">
              <Translate contentKey="tempApp.tax.desc">Description</Translate>
            </dt>
            <dd className="col-span-2 text-xs">{taxProfileEntity.description}</dd>
          </div>

          <div className="grid grid-cols-3 gap-4 py-2 border-b">
            <dt className="text-xs font-semibold">Tax Rate</dt>
            <dd className="col-span-2 text-xs">
              {taxProfileEntity.taxRate ? `${taxProfileEntity.taxRate.code} (${taxProfileEntity.taxRate.value})` : ''}
            </dd>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="secondary" className="h-8 text-xs">
            <Link to="/tax-profiles" data-cy="entityDetailsBackButton">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.back">Back</Translate>
            </Link>
          </Button>
          <Button asChild className="h-8 text-xs">
            <Link to={`/tax-profiles/${taxProfileEntity.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.edit">Edit</Translate>
            </Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default TaxProfileDetail;
