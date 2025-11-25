import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getLockOrderTakingStatus, updateLockOrderTaking } from 'app/entities/branch/lock-order-taking.reducer';
import { getInitialConfiguration, submitEndOfDay, reset, getLastEndOfDay } from './end-of-day.reducer';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const lastEod = useAppSelector(state => state.endOfDay.lastEod);
  const lastEodLoading = useAppSelector(state => state.endOfDay.lastEodLoading);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBranchTimezone, setSelectedBranchTimezone] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [toTime, setToTime] = useState<string>('23:59:59');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<EndOfDaySection[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [isInitialized, setIsInitialized] = useState(false);
  const [actualCash, setActualCash] = useState<string>('');
  const [isFullDay, setIsFullDay] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [ordersRefetchKey, setOrdersRefetchKey] = useState<number>(0);

  // Track selectedSections changes
  useEffect(() => {
    console.log('[end-of-day.tsx] selectedSections state changed to:', selectedSections);
  }, [selectedSections]);

  // Initialize from URL params
  useEffect(() => {
    dispatch(getBranches({ page: 0, size: 300, sort: 'asc' }));
  }, [dispatch]);

  // Read URL params on mount
  useEffect(() => {
    if (branchList.length > 0 && !isInitialized) {
      const branchId = searchParams.get('branch');
      const toDateParam = searchParams.get('toDate');
      const toTimeParam = searchParams.get('toTime');
      const tab = searchParams.get('tab');

      if (branchId) {
        const branch = branchList.find(b => b.id === branchId);
        if (branch) {
          setSelectedBranchId(branchId);
          setSelectedBranchTimezone(branch.timezone);
        }
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
      dispatch(getLastEndOfDay(selectedBranchId));
    }
  }, [selectedBranchId, dispatch]);

  // Polling for EOD status and orders refresh
  useEffect(() => {
    if (!selectedBranchId) return;

    const pollInterval = setInterval(() => {
      dispatch(getLastEndOfDay(selectedBranchId));
      // Trigger orders refetch by incrementing the key
      setOrdersRefetchKey(prev => prev + 1);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [selectedBranchId, dispatch]);

  useEffect(() => {
    console.log('[end-of-day.tsx] Config useEffect triggered');
    console.log('[end-of-day.tsx] Config changed:', {
      configSections: config?.defaultSelectedSections,
      currentSections: selectedSections,
      branchId: selectedBranchId
    });
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
      // REMOVED - DON'T set sections from config here, let SectionsTab handle it
      console.log('[end-of-day.tsx] Config loaded, NOT touching sections (managed by SectionsTab)');
    }
  }, [config]);

  useEffect(() => {
    if (submitSuccess) {
      toast.success('End of Day submitted successfully');
      dispatch(reset());
      // Trigger orders refetch by incrementing the key
      setOrdersRefetchKey(prev => prev + 1);
      // Optionally navigate or reset form
    }
  }, [submitSuccess]);

  const handleBranchChange = (branchId: string) => {
    console.log('[end-of-day.tsx] handleBranchChange called:', branchId);
    setSelectedBranchId(branchId);

    // Set the branch timezone
    const branch = branchList.find(b => b.id === branchId);
    setSelectedBranchTimezone(branch?.timezone);
    console.log('[end-of-day.tsx] Branch timezone set to:', branch?.timezone);

    setFromDate('');
    setToDate(undefined);
    setToTime('23:59:59');
    // Note: sections will be reset automatically via key={selectedBranchId} on SectionsTab
    setActualCash('');
  };

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return dateToUTCString(tomorrow, selectedBranchTimezone);
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

    // For partial day, validate date/time
    if (!isFullDay) {
      const combinedDateTime = getCombinedDateTime();
      if (!combinedDateTime) {
        toast.error('Please select an end date and time');
        return;
      }
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

    const selectedBranch = branchList.find(b => b.id === selectedBranchId);
    if (!selectedBranch) {
      toast.error('Selected branch not found');
      return;
    }

    // Convert the date to UTC string using branch timezone (null for full day)
    const toDateUTC = isFullDay ? null : dateToUTCString(getCombinedDateTime()!, selectedBranchTimezone);

    dispatch(submitEndOfDay({
      actionTakenBy: account?.login || 'unknown',
      branch: selectedBranch,
      toDate: toDateUTC,
      sections: selectedSections,
      actualCash: actualCashNumber,
      fullDay: isFullDay
    }));
  };

  const handleStopProcessingOrders = () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }

    // For full day mode, we don't send a date (null)
    // For partial day mode, we need to validate and send the date
    let toDateUTC: string | null = null;

    if (!isFullDay) {
      const combinedDateTime = getCombinedDateTime();
      if (!combinedDateTime) {
        toast.error('Please select an end date and time');
        return;
      }
      toDateUTC = dateToUTCString(combinedDateTime, selectedBranchTimezone);
    }

    const newLockState = !lockOrderTaking.locked;

    dispatch(updateLockOrderTaking({
      branchId: selectedBranchId,
      lock: newLockState,
      date: toDateUTC
    })).then(() => {
      toast.success(newLockState ? 'Order processing stopped' : 'Order processing resumed');
      // Refresh lock status
      dispatch(getLockOrderTakingStatus(selectedBranchId));
    });
  };

  const minDate = fromDate ? addSeconds(new Date(fromDate), 1) : undefined;

  return (
    <PageWrapper className="!overflow-x-hidden !max-w-full">
      <div className="flex h-full gap-6 w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-5 overflow-y-auto p-4 bg-white border-r border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              <Translate contentKey="endOfDay.title">End of Day</Translate>
            </h2>
            <p className="text-sm text-gray-500">Manage daily closing operations</p>
          </div>

          {/* Branch Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              <Translate contentKey="endOfDay.branch">Branch</Translate>
            </Label>
            <Select
              value={selectedBranchId || ''}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500">
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

          {/* Day Type Selection */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Day Type</Label>
            <RadioGroup value={isFullDay ? 'full' : 'partial'} onValueChange={(value) => setIsFullDay(value === 'full')} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <RadioGroupItem value="full" id="full-day" />
                <Label htmlFor="full-day" className="font-normal cursor-pointer text-sm flex-1">
                  Close All Sales
                  <span className="block text-xs text-gray-500">Complete day closure</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <RadioGroupItem value="partial" id="partial-day" />
                <Label htmlFor="partial-day" className="font-normal cursor-pointer text-sm flex-1">
                  Partially Close Sales
                  <span className="block text-xs text-gray-500">Custom time range</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* From Date (Read-only) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              <Translate contentKey="endOfDay.fromDate">From Date</Translate>
            </Label>
            <Input
              value={loading ? 'Loading...' : fromDate ? formatDateForDisplay(fromDate, 'yyyy-MM-dd HH:mm:ss', selectedBranchTimezone) : ''}
              disabled
              className="h-10 text-sm bg-gray-50 border-gray-300"
              placeholder="Select branch first"
            />
          </div>

          {/* To Date and Time (Only for Partial Day) */}
          {!isFullDay && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  <Translate contentKey="endOfDay.toDate">To Date & Time</Translate>
                </Label>
                <div className="flex gap-2">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 flex-1 justify-between text-left text-sm font-normal border-gray-300 focus:ring-2 focus:ring-blue-500"
                        disabled={!fromDate}
                      >
                        {toDate ? toDate.toLocaleDateString() : 'Select date'}
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
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
                  <Input
                    type="time"
                    step="1"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    disabled={!fromDate}
                    className="h-10 w-32 text-sm bg-background border-gray-300"
                  />
                </div>
              </div>
            </>
          )}

          {/* Separator */}
          <div className="border-t border-gray-200"></div>

          {/* EOD Status */}
          {lastEod && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Last End of Day</h3>
              <div className={`p-4 rounded-lg border-2 shadow-sm ${
                lastEod.status === 'COMPLETED' || !lastEod.status ? 'bg-green-50 border-green-300' :
                lastEod.status === 'RUNNING' ? 'bg-blue-50 border-blue-300 animate-pulse' :
                lastEod.status === 'FAILED' ? 'bg-red-50 border-red-300' :
                lastEod.status === 'CANCELLED' ? 'bg-yellow-50 border-yellow-300' :
                'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full ${
                    lastEod.status === 'COMPLETED' || !lastEod.status ? 'bg-green-600' :
                    lastEod.status === 'RUNNING' ? 'bg-blue-600 animate-pulse' :
                    lastEod.status === 'FAILED' ? 'bg-red-600' :
                    lastEod.status === 'CANCELLED' ? 'bg-yellow-600' :
                    'bg-gray-500'
                  }`}></span>
                  <p className="text-sm font-semibold text-gray-800">
                    {lastEod.status || 'COMPLETED'}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">EOD #{lastEod.number}</p>
                {lastEod.toDateString && (
                  <p className="text-xs text-gray-500 mt-1">{formatDateForDisplay(lastEod.toDateString, 'yyyy-MM-dd HH:mm:ss', selectedBranchTimezone)}</p>
                )}
              </div>
            </div>
          )}

          {lastEodLoading && !lastEod && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Loading status...</p>
            </div>
          )}

          {/* Actions Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</h3>

            {/* Full Day - Multi Step */}
            {isFullDay && (
              <div className="space-y-4">
                {/* Step Indicator */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={currentStep === 0 ? 'text-blue-600 font-semibold' : ''}>
                    Step {currentStep + 1} of 2
                  </span>
                </div>

                {/* Step 1: Stop/Unlock Orders */}
                {currentStep === 0 && (
                  <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">
                        {((lastEod?.status === 'COMPLETED' || lastEod?.status === 'FAILED' || lastEod?.status === 'CANCELLED' || !lastEod?.status) && lockOrderTaking.locked)
                          ? 'Unlock Order Processing'
                          : 'Stop Processing Orders'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {((lastEod?.status === 'COMPLETED' || lastEod?.status === 'FAILED' || lastEod?.status === 'CANCELLED' || !lastEod?.status) && lockOrderTaking.locked)
                          ? 'Resume accepting new orders'
                          : 'Prevent new orders from being placed'}
                      </p>
                    </div>
                    <Button
                      onClick={handleStopProcessingOrders}
                      disabled={!selectedBranchId || lockOrderTaking.updating}
                      variant={((lastEod?.status === 'COMPLETED' || lastEod?.status === 'FAILED' || lastEod?.status === 'CANCELLED' || !lastEod?.status) && lockOrderTaking.locked) ? 'default' : 'destructive'}
                      size="sm"
                      className={`w-full h-10 font-medium shadow-sm ${
                        ((lastEod?.status === 'COMPLETED' || lastEod?.status === 'FAILED' || lastEod?.status === 'CANCELLED' || !lastEod?.status) && lockOrderTaking.locked)
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }`}
                    >
                      {lockOrderTaking.updating ? 'Processing...' :
                        ((lastEod?.status === 'COMPLETED' || lastEod?.status === 'FAILED' || lastEod?.status === 'CANCELLED' || !lastEod?.status) && lockOrderTaking.locked)
                          ? 'Unlock Orders'
                          : 'Stop Orders'
                      }
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(1)}
                      disabled={!lockOrderTaking.locked}
                      size="sm"
                      variant="outline"
                      className="w-full h-10 font-medium"
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Step 2: Enter Cash & End Day */}
                {currentStep === 1 && (
                  <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">Enter Cash & End Day</h4>
                      <p className="text-xs text-gray-600 mt-1">Complete the day-end process</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actual-cash" className="text-xs font-semibold text-gray-700">
                        Actual Cash <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="actual-cash"
                        type="number"
                        step="0.01"
                        min="0"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        placeholder="0.00"
                        className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500"
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentStep(0)}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-10 font-medium"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleEndDay}
                        disabled={!actualCash || submitting}
                        size="sm"
                        className="flex-1 h-10 font-medium shadow-sm bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? 'Submitting...' : 'End Day'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Partial Day - Single Step */}
            {!isFullDay && (
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <h4 className="font-semibold text-sm text-gray-800">Enter Cash & End Day</h4>
                  <p className="text-xs text-gray-600 mt-1">Complete the partial day process</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual-cash-partial" className="text-xs font-semibold text-gray-700">
                    Actual Cash <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="actual-cash-partial"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="0.00"
                    className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>
                <Button
                  onClick={handleEndDay}
                  disabled={!selectedBranchId || !toDate || !actualCash || submitting}
                  size="sm"
                  className="w-full h-10 font-medium shadow-sm bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Submitting...' : 'End Day'}
                </Button>
              </div>
            )}
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
              <TabsContent value="orders" className="mt-0 h-full overflow-hidden" forceMount hidden={activeTab !== 'orders'}>
                <OrdersTab
                  key={ordersRefetchKey}
                  branchId={selectedBranchId}
                  fromDate={fromDate}
                  toDate={isFullDay ? getTomorrowDate() : (getCombinedDateTime() ? dateToUTCString(getCombinedDateTime()!, selectedBranchTimezone) : null)}
                />
              </TabsContent>

              {config?.endingType !== 'END_OF_DAY' && (
                <TabsContent value="openTills" className="mt-0" forceMount hidden={activeTab !== 'openTills'}>
                  <OpenTillsTab branchId={selectedBranchId} />
                </TabsContent>
              )}

              <TabsContent value="sections" className="mt-0" forceMount hidden={activeTab !== 'sections'}>
                <SectionsTab
                  key={selectedBranchId || 'no-branch'}
                  defaultSections={config?.defaultSelectedSections || []}
                  onSelectionChange={(sections) => {
                    console.log('[end-of-day.tsx] onSelectionChange callback received:', sections);
                    setSelectedSections(sections);
                  }}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0" forceMount hidden={activeTab !== 'preview'}>
                <PreviewTab
                  branchId={selectedBranchId}
                  toDate={isFullDay ? getTomorrowDate() : (getCombinedDateTime() ? dateToUTCString(getCombinedDateTime()!, selectedBranchTimezone) : null)}
                  sections={selectedSections}
                  branchTimezone={selectedBranchTimezone}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </PageWrapper>
  );
};

export default EndOfDay;
