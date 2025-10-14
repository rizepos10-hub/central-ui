import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import { translate, Translate } from "react-jhipster";
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from "app/config/store";
import { getEntity, updateEntities } from "app/entities/loyalty/loyalty-records.reducer";
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export const LoyaltyUpdate = () => {
  const { id: customerId } = useParams<'id'>();

  const dispatch = useAppDispatch();
  const record = useAppSelector(state => state.loyalty.entity);
  const loading = useAppSelector(state => state.loyalty.loading);
  const updating = useAppSelector(state => state.loyalty.updating);
  const updateSuccess = useAppSelector(state => state.loyalty.updateSuccess);

  const navigate = useNavigate();

  const [points, setPoints] = useState<number>(0);

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
      navigate('/loyalty');
    }
  }, [updateSuccess])

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          <Translate contentKey={'loyalty.update.title'}>Edit Loyalty Points</Translate>
        </h2>

        {loading ? (
          <p className="text-xs">Loading...</p>
        ) : (
          <div className="max-w-2xl">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <form onSubmit={onSave} className="space-y-4">
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
                    <Label htmlFor="points" className="text-xs font-semibold">
                      <Translate contentKey={'loyalty.update.points'}>Points</Translate>
                    </Label>
                    <Input
                      type="number"
                      id="points"
                      placeholder={translate('loyalty.update.points')}
                      value={points || 0}
                      onChange={handlePointsChange}
                      className="h-7 text-xs"
                      step="0.00001"
                    />
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
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={updating}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
