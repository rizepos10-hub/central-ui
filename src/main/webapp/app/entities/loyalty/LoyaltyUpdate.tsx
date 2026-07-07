import React, { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { translate, Translate } from "react-jhipster";
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntity, updateEntities } from "app/entities/loyalty/loyalty-records.reducer";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import LoyaltyPointHistoryTable from './components/LoyaltyPointHistoryTable';

export const LoyaltyUpdate = () => {
  const { id: customerId } = useParams<'id'>();

  const dispatch = useAppDispatch();
  const record = useAppSelector(state => state.loyalty.entity);
  const loading = useAppSelector(state => state.loyalty.loading);
  const updating = useAppSelector(state => state.loyalty.updating);
  const updateSuccess = useAppSelector(state => state.loyalty.updateSuccess);

  const [points, setPoints] = useState<number>(0);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);

  const handlePointsChange = (e) => {
    setPoints(Number(e.target.value));
  }

  const onSave = (e) => {
    e.preventDefault();
    dispatch(updateEntities({ id: record.id, points }));
  }

  useEffect(() => {
    dispatch(getEntity(customerId));
  }, [])

  useEffect(() => {
    setPoints(record.points);
  }, [record])

  useEffect(() => {
    if (updateSuccess) {
      dispatch(getEntity(customerId));
      setHistoryReloadKey(prev => prev + 1);
    }
  }, [customerId, dispatch, updateSuccess])

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          <Translate contentKey={'loyalty.update.title'}>Edit Loyalty Points</Translate>
        </h2>

        {loading ? (
          <p className="text-xs">Loading...</p>
        ) : (
          <div className="max-w-4xl space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      <Translate contentKey={'loyalty.update.name'}>Name</Translate>
                    </Label>
                    <p className="text-xs">{record.customer?.firstName} {record.customer?.lastName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      <Translate contentKey={'loyalty.update.email'}>Email</Translate>
                    </Label>
                    <p className="text-xs">{record.customer?.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      <Translate contentKey={'loyalty.update.points'}>Points</Translate>
                    </Label>
                    <p className="text-xs">{record.points ?? 0}</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      asChild
                    >
                      <Link to="/loyalty">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        <Translate contentKey="entity.action.back">Back</Translate>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <LoyaltyPointHistoryTable customerId={customerId} reloadKey={historyReloadKey} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
