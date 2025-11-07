import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getInitialConfiguration, submitEndOfDay, reset } from './end-of-day.reducer';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addSeconds } from 'date-fns';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { Translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { EndOfDaySection } from 'app/shared/model/end-of-day-config.model';
import { OrdersTab } from './orders-tab';
import { OpenTillsTab } from './open-tills-tab';
import { SectionsTab } from './sections-tab';
import { PreviewTab } from './preview-tab';

const EndOfDay = () => {
  const dispatch = useAppDispatch();
  const branchList = useAppSelector(state => state.branch.entities);
  const config = useAppSelector(state => state.endOfDay.config);
  const loading = useAppSelector(state => state.endOfDay.loading);
  const submitting = useAppSelector(state => state.endOfDay.submitting);
  const submitSuccess = useAppSelector(state => state.endOfDay.submitSuccess);
  const account = useAppSelector(state => state.authentication.account);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [selectedSections, setSelectedSections] = useState<EndOfDaySection[]>([]);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    dispatch(getBranches({ page: 0, size: 300, sort: 'asc' }));
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      dispatch(getInitialConfiguration(selectedBranchId));
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (config) {
      setFromDate(config.startDate || '');
      if (config.defaultEndDate) {
        setToDate(new Date(config.defaultEndDate));
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
    setSelectedSections([]);
  };

  const handleEndDay = () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch');
      return;
    }

    if (!toDate) {
      toast.error('Please select an end date');
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

    dispatch(submitEndOfDay({
      actionTakenBy: account?.login || 'unknown',
      branch: selectedBranch,
      toDate: toDate.toISOString(),
      sections: selectedSections
    }));
  };

  const minDate = fromDate ? addSeconds(new Date(fromDate), 1) : undefined;

  return (
    <PageWrapper>
      <div className="flex h-full gap-4">
        {/* Left Sidebar */}
        <div className="w-64 space-y-4">
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
              value={fromDate ? formatDateForDisplay(fromDate) : ''}
              disabled
              className="h-9 text-sm"
              placeholder="Select branch first"
            />
          </div>

          {/* To Date (Editable) */}
          <div className="space-y-2">
            <Label><Translate contentKey="endOfDay.toDate">To Date</Translate></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 w-full justify-start text-left text-sm font-normal',
                    !toDate && 'text-muted-foreground'
                  )}
                  disabled={!fromDate}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {toDate ? format(toDate, 'PP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  disabled={(date) => minDate ? date < minDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="orders">
                <Translate contentKey="endOfDay.tabs.orders">Orders</Translate>
              </TabsTrigger>
              <TabsTrigger value="openTills">
                <Translate contentKey="endOfDay.tabs.openTills">Open Tills</Translate>
              </TabsTrigger>
              <TabsTrigger value="sections">
                <Translate contentKey="endOfDay.tabs.sections">Sections</Translate>
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Translate contentKey="endOfDay.tabs.preview">Preview</Translate>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4">
              <TabsContent value="orders" className="mt-0 h-full">
                <OrdersTab
                  branchId={selectedBranchId}
                  fromDate={fromDate}
                  toDate={toDate?.toISOString() || ''}
                />
              </TabsContent>

              <TabsContent value="openTills" className="mt-0">
                <OpenTillsTab branchId={selectedBranchId} />
              </TabsContent>

              <TabsContent value="sections" className="mt-0">
                <SectionsTab
                  defaultSections={config?.defaultSelectedSections || []}
                  onSelectionChange={setSelectedSections}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <PreviewTab />
              </TabsContent>
            </div>
          </Tabs>

          {/* End Day Button */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button
              onClick={handleEndDay}
              disabled={!selectedBranchId || !toDate || submitting}
              size="lg"
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
