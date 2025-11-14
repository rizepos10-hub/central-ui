import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getLockOrderTakingStatus, updateLockOrderTaking } from 'app/entities/branch/lock-order-taking.reducer';
import { getInitialConfiguration, submitEndOfDay, reset } from './end-of-day.reducer';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
import { addSeconds } from 'date-fns';
import { Translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { formatDateForDisplay, dateToUTCString } from 'app/shared/util/timezone-utils';
import { EndOfDaySection } from 'app/shared/model/end-of-day-config.model';
import { OrdersTab } from './orders-tab';
import { OpenTillsTab } from './open-tills-tab';
import { SectionsTab } from './sections-tab';
import { PreviewTab } from './preview-tab';

const EndOfDay = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const branchList = useAppSelector(state => state.branch.entities);
  const config = useAppSelector(state => state.endOfDay.config);
  const loading = useAppSelector(state => state.endOfDay.loading);
  const submitting = useAppSelector(state => state.endOfDay.submitting);
  const submitSuccess = useAppSelector(state => state.endOfDay.submitSuccess);
  const account = useAppSelector(state => state.authentication.account);
  const lockOrderTaking = useAppSelector(state => state.lockOrderTaking);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [toTime, setToTime] = useState<string>('23:59:59');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<EndOfDaySection[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [isInitialized, setIsInitialized] = useState(false);
  const [actualCash, setActualCash] = useState<string>('');

  // Initialize from URL params
  useEffect(() => {
    dispatch(getBranches({ page: 0, size: 300, sort: 'asc' }));
  }, []);

  // Read URL params on mount
  useEffect(() => {
    if (branchList.length > 0 && !isInitialized) {
      const branchId = searchParams.get('branch');
      const toDateParam = searchParams.get('toDate');
      const toTimeParam = searchParams.get('toTime');
      const tab = searchParams.get('tab');

      if (branchId && branchList.find(b => b.id === branchId)) {
        setSelectedBranchId(branchId);
      }

      if (toDateParam) {
        try {
          setToDate(new Date(toDateParam));
        } catch (e) {
          console.error('Invalid toDate param:', e);
        }
      }

      if (toTimeParam) {
        setToTime(toTimeParam);
      }

      if (tab) {
        setActiveTab(tab);
      }

      setIsInitialized(true);
    }
  }, [branchList, isInitialized]);

  // Update URL params when filters change
  useEffect(() => {
    if (isInitialized) {
      const params = new URLSearchParams();

      if (selectedBranchId) {
        params.set('branch', selectedBranchId);
      }

      if (toDate) {
        params.set('toDate', toDate.toISOString());
      }

      if (toTime && toTime !== '23:59:59') {
        params.set('toTime', toTime);
      }

      if (activeTab !== 'orders') {
        params.set('tab', activeTab);
      }

      setSearchParams(params, { replace: true });
    }
  }, [selectedBranchId, toDate, toTime, activeTab, isInitialized]);

  useEffect(() => {
    if (selectedBranchId) {
      dispatch(getInitialConfiguration(selectedBranchId));
      dispatch(getLockOrderTakingStatus(selectedBranchId));
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (config) {
      setFromDate(config.startDate || '');
      if (config.defaultEndDate) {
        const endDate = new Date(config.defaultEndDate);
        setToDate(endDate);
        // Extract time from the default end date
        const hours = endDate.getHours().toString().padStart(2, '0');
        const minutes = endDate.getMinutes().toString().padStart(2, '0');
        const seconds = endDate.getSeconds().toString().padStart(2, '0');
        setToTime(`${hours}:${minutes}:${seconds}`);
      }
      setSelectedSections(config.defaultSelectedSections || []);
    }
  }, [config]);

  useEffect(() => {
    if (submitSuccess) {
      toast.success('End of Day submitted successfully');
      dispatch(reset());
      // Optionally navigate or reset form
    }
  }, [submitSuccess]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setFromDate('');
    setToDate(undefined);
    setToTime('23:59:59');
    setSelectedSections([]);
    setActualCash('');
  };

  const getCombinedDateTime = (): Date | undefined => {
    if (!toDate || !toTime) return undefined;

    const [hours, minutes, seconds] = toTime.split(':').map(Number);
    const combined = new Date(toDate);
    combined.setHours(hours, minutes, seconds, 0);
    return combined;
  };

  const handleEndDay = () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }

    const combinedDateTime = getCombinedDateTime();
    if (!combinedDateTime) {
      toast.error('Please select an end date and time');
      return;
    }

    if (!actualCash || actualCash.trim() === '') {
      toast.error('Actual Cash is required');
      return;
    }

    const actualCashNumber = parseFloat(actualCash);
    if (isNaN(actualCashNumber) || actualCashNumber < 0) {
      toast.error('Please enter a valid positive number for Actual Cash');
      return;
    }

    if (selectedSections.length === 0) {
      toast.warn('No sections selected');
    }

    const selectedBranch = branchList.find(b => b.id === selectedBranchId);
    if (!selectedBranch) {
      toast.error('Selected branch not found');
      return;
    }

    // Convert the date to UTC string using business timezone
    const toDateUTC = dateToUTCString(combinedDateTime);

    dispatch(submitEndOfDay({
      actionTakenBy: account?.login || 'unknown',
      branch: selectedBranch,
      toDate: toDateUTC,
      sections: selectedSections,
      actualCash: actualCashNumber
    }));
  };

  const handleStopProcessingOrders = () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }

    const combinedDateTime = getCombinedDateTime();
    if (!combinedDateTime) {
      toast.error('Please select an end date');
      return;
    }

    const toDateUTC = dateToUTCString(combinedDateTime);
    const newLockState = !lockOrderTaking.locked;

    dispatch(updateLockOrderTaking({
      branchId: selectedBranchId,
      lock: newLockState,
      date: toDateUTC
    })).then(() => {
      toast.success(newLockState ? 'Order processing stopped' : 'Order processing resumed');
    });
  };

  const minDate = fromDate ? addSeconds(new Date(fromDate), 1) : undefined;

  return (
    <PageWrapper className="!overflow-x-hidden !max-w-full">
      <div className="flex h-full gap-4 w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              <Translate contentKey="endOfDay.title">End of Day</Translate>
            </h2>
          </div>

          {/* Branch Selector */}
          <div className="space-y-2">
            <Label><Translate contentKey="endOfDay.branch">Branch</Translate></Label>
            <Select
              value={selectedBranchId || ''}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branchList.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date (Read-only) */}
          <div className="space-y-2">
            <Label><Translate contentKey="endOfDay.fromDate">From Date</Translate></Label>
            <Input
              value={loading ? 'Loading...' : fromDate ? formatDateForDisplay(fromDate) : ''}
              disabled
              className="h-9 text-sm"
              placeholder="Select branch first"
            />
          </div>

          {/* To Date (Editable) */}
          <div className="space-y-2">
            <Label><Translate contentKey="endOfDay.toDate">To Date</Translate></Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between text-left text-sm font-normal"
                  disabled={!fromDate}
                >
                  {toDate ? toDate.toLocaleDateString() : 'Select date'}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setToDate(date);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => minDate ? date < minDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Time */}
          <div className="space-y-2">
            <Label htmlFor="time-picker"><Translate contentKey="endOfDay.toTime">To Time</Translate></Label>
            <Input
              type="time"
              id="time-picker"
              step="1"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              disabled={!fromDate}
              className="h-9 text-sm bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList>
              <TabsTrigger value="orders">
                <Translate contentKey="endOfDay.tabs.orders">Orders</Translate>
              </TabsTrigger>
              {config?.endingType !== 'END_OF_DAY' && (
                <TabsTrigger value="openTills">
                  <Translate contentKey="endOfDay.tabs.openTills">Open Tills</Translate>
                </TabsTrigger>
              )}
              <TabsTrigger value="sections">
                <Translate contentKey="endOfDay.tabs.sections">Sections</Translate>
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Translate contentKey="endOfDay.tabs.preview">Preview</Translate>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-w-0 overflow-hidden">
              <TabsContent value="orders" className="mt-0 h-full overflow-hidden">
                <OrdersTab
                  branchId={selectedBranchId}
                  fromDate={fromDate}
                  toDate={getCombinedDateTime() ? dateToUTCString(getCombinedDateTime()!) : ''}
                />
              </TabsContent>

              {config?.endingType !== 'END_OF_DAY' && (
                <TabsContent value="openTills" className="mt-0">
                  <OpenTillsTab branchId={selectedBranchId} />
                </TabsContent>
              )}

              <TabsContent value="sections" className="mt-0">
                <SectionsTab
                  defaultSections={config?.defaultSelectedSections || []}
                  onSelectionChange={setSelectedSections}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <PreviewTab
                  branchId={selectedBranchId}
                  toDate={getCombinedDateTime() ? dateToUTCString(getCombinedDateTime()!) : ''}
                  sections={selectedSections}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Actual Cash and End Day Button */}
          <div className="flex justify-end items-end gap-2 mt-4 pt-4 border-t">
            <div className="flex flex-col gap-2 w-64">
              <Label htmlFor="actual-cash">
                <Translate contentKey="endOfDay.actualCash">Actual Cash</Translate>
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="actual-cash"
                type="number"
                step="0.01"
                min="0"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="h-10"
                disabled={!selectedBranchId || submitting}
              />
            </div>
            <Button
              onClick={handleStopProcessingOrders}
              disabled={!selectedBranchId || !toDate || lockOrderTaking.updating}
              variant={lockOrderTaking.locked ? 'default' : 'destructive'}
              size="lg"
              className="h-10"
            >
              {lockOrderTaking.updating ? 'Processing...' : lockOrderTaking.locked ? 'Resume Orders' : 'Stop Processing Orders'}
            </Button>
            <Button
              onClick={handleEndDay}
              disabled={!selectedBranchId || !toDate || !actualCash || submitting}
              size="lg"
              className="h-10"
            >
              {submitting ? 'Submitting...' : <Translate contentKey="endOfDay.endDay">End Day</Translate>}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default EndOfDay;
