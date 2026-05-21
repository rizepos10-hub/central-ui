import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { useLocation, useNavigate } from 'react-router-dom';
import { OrderMethod } from 'app/shared/model/ENUMS/order-method.model';
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill } from 'app/shared/model/till.model';
import { getEntitiesByStatusOpened } from '../settings/branch-registry/till/till.reducer';
import { ArrowLeft, Loader2, Monitor, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/src/main/webapp/app/lib/utils';

const ChooseBranch = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const ORDER_METHOD = 'orderMethod';
  const authorities = useAppSelector(state => state.authentication.account?.authorities || []);
  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
  const loadingRegistries = useAppSelector(state => state.branchRegistry.loading);
  const searchParams = new URLSearchParams(location.search);
  const isWholesaleMode = searchParams.get('mode') === 'wholesale' || location.pathname.includes('/logistics/create-order');
  const isWholesaleSalesmanMode = isWholesaleMode && authorities.includes('ROLE_WHOLESALE_SALESMAN');
  const restrictedBranchIds = (searchParams.get('branchIds') || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  const hasAutoSelectedRegistry = useRef(false);

  const [tillList, setTillList] = useState<ITill[]>([]);

  const getOpenTills = (ids: string[]) => {
    if (ids.length === 0) {
      setTillList([]);
      return;
    }

    dispatch(getEntitiesByStatusOpened(ids)).then(action => {
      const tillsList = (action?.payload as { data: ITill[] })?.data;
      setTillList(tillsList || []);
    });
  };

  useEffect(() => {
    const branchRegistryIds = branchRegistry.map(record => record.id).filter(Boolean);
    getOpenTills(branchRegistryIds);
  }, [branchRegistry]);

  const availableRegistries = useMemo(
    () =>
      restrictedBranchIds.length > 0
        ? branchRegistry.filter(registry => restrictedBranchIds.includes(registry?.branch?.id))
        : branchRegistry,
    [branchRegistry, restrictedBranchIds]
  );

  const handleRegistryClick = (registry: IBranchRegistry) => {
    checkTillStatus(registry);
    navigate(`/order/create?registerId=${registry?.id}${isWholesaleMode ? '&mode=wholesale' : ''}`);
  };

  const checkTillStatus = (registry: IBranchRegistry) => {
    dispatch(
      changeEntityField({
        name: 'branchId',
        value: registry?.branch?.id,
      })
    );

    const orderMethod = localStorage.getItem(ORDER_METHOD) || OrderMethod.PickUp;
    dispatch(
      changeEntityField({
        name: 'orderMethod',
        value: orderMethod as OrderMethod,
      })
    );
  };

  useEffect(() => {
    dispatch(
      getEntitiesByType({
        type: RegisterType.ONLINE,
      })
    );
    if (!isWholesaleSalesmanMode) {
      dispatch(reset());
    }
  }, [dispatch, isWholesaleSalesmanMode]);

  useEffect(() => {
    if (hasAutoSelectedRegistry.current) {
      return;
    }

    if (!isWholesaleMode || restrictedBranchIds.length === 0) {
      return;
    }

    if (availableRegistries.length !== 1) {
      return;
    }

    hasAutoSelectedRegistry.current = true;
    handleRegistryClick(availableRegistries[0]);
  }, [availableRegistries, isWholesaleMode, restrictedBranchIds.length]);

  const title = isWholesaleMode ? 'Select Register for Wholesale Order' : 'Select Register';
  const subtitle = isWholesaleMode
    ? 'Choose the online register that will be used for this wholesale order.'
    : 'Choose the online register that will be used for this order.';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xl font-semibold tracking-tight">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-9 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {loadingRegistries ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Loading registers</p>
              <p className="text-sm text-muted-foreground">Fetching available online registers for order creation.</p>
            </div>
          </CardContent>
        </Card>
      ) : availableRegistries.length === 0 ? (
        <Card className="border-dashed border-border/70 shadow-sm">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold">No online registers available</p>
              <p className="max-w-md text-sm text-muted-foreground">
                This step uses the online branch register API, and no matching registers were returned.
                Create or enable an online register first, then try again.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {availableRegistries.map(registry => {
            const openTill = tillList.find(till => till?.registry?.id === registry?.id && till?.status === 'OPENED');
            const isSelected = orderEntity?.branchId === registry?.branch?.id;

            return (
              <button
                key={registry.id}
                type="button"
                className={cn(
                  'rounded-2xl border bg-white p-0 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30',
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/60'
                )}
                onClick={() => handleRegistryClick(registry)}
              >
                <div className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">{registry?.branch?.name || 'Unnamed Branch'}</p>
                      <p className="text-sm text-muted-foreground">{registry?.name || 'Online Register'}</p>
                    </div>
                    <Badge
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider',
                        openTill ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {openTill ? 'Till Open' : 'Till Closed'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Register Type</p>
                      <p className="mt-1 font-medium">Online</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Code</p>
                      <p className="mt-1 font-medium">{registry?.code || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>Continue with this register</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChooseBranch;
