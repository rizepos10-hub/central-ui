import React from 'react';
import Select from 'react-select';

import { Input } from '@/components/ui/input';
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { IBranchDetails, KitchenOutputMode, KitchenPrintGrouping } from 'app/shared/model/business-detail.model';
import { EndingType } from 'app/shared/model/ENUMS/ending-type.model';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import { PosHomePage } from 'app/shared/model/ENUMS/pos-home-page.model';
import allTimeZones from '../../../content/samples/all_time_zones.json';

import { SettingField, SettingToggle, SettingsCard } from './branch-settings-ui';

const KITCHEN_OUTPUT_OPTIONS: { value: KitchenOutputMode; label: string }[] = [
  { value: KitchenOutputMode.PRINT, label: 'Printers only' },
  { value: KitchenOutputMode.KDS, label: 'KDS only' },
  { value: KitchenOutputMode.BOTH, label: 'Both printers and KDS' },
];

const GROUPING_LABEL: Record<KitchenPrintGrouping, string> = {
  [KitchenPrintGrouping.NONE]: 'None',
  [KitchenPrintGrouping.SEAT]: 'Seat',
  [KitchenPrintGrouping.COURSE]: 'Course',
  [KitchenPrintGrouping.TIMESTAMP]: 'Timestamp',
};

const POS_HOME_PAGE_OPTIONS: { value: PosHomePage; label: string }[] = [
  { value: PosHomePage.NONE, label: 'None' },
  { value: PosHomePage.REGISTER, label: 'Register' },
  { value: PosHomePage.FLOOR_PLAN, label: 'Floor Plan' },
  { value: PosHomePage.LOG_IN, label: 'Log-In' },
];

const END_OF_DAY_SECTION_OPTIONS = Object.values(EndOfDayReportSection).map(section => ({ value: section, label: section }));

export interface BranchDetailsTabProps {
  branch: IBranchDetails;
  branchIndex: number;
  maxIdleTimeoutSeconds: number;
  set: (field: keyof IBranchDetails, value: unknown) => void;
  onImageChange: (value: unknown) => void;
  onReceiptTextChange: (field: 'receiptHeader' | 'receiptFooter' | 'hstNumber' | 'gstNumber' | 'pstNumber', value: string) => void;
  onTimeZoneChange: (timeZone: unknown) => void;
  onEndOfDayReportSectionChange: (options: unknown) => void;
  onIdleTimeoutSecondsChange: (value: string) => void;
  onPrepTimeMinutesChange: (value: string) => void;
}

/** The branch Details tab: branch settings grouped into cards. Settings marked "soon" are shown but not stored yet. */
export const BranchDetailsTab = ({
  branch,
  branchIndex,
  maxIdleTimeoutSeconds,
  set,
  onImageChange,
  onReceiptTextChange,
  onTimeZoneChange,
  onEndOfDayReportSectionChange,
  onIdleTimeoutSecondsChange,
  onPrepTimeMinutesChange,
}: BranchDetailsTabProps) => {
  const id = (name: string) => `${name}-${branchIndex}`;
  const receiptText = (field: Parameters<BranchDetailsTabProps['onReceiptTextChange']>[0], label: string, description?: string) => (
    <SettingField id={id(field)} label={label} description={description}>
      <Input
        id={id(field)}
        type="text"
        className="ws-control"
        value={branch[field] || ''}
        onChange={e => onReceiptTextChange(field, e.target.value)}
        onBlur={e => onReceiptTextChange(field, e.target.value.trim())}
      />
    </SettingField>
  );

  return (
    <div className="theme-wholesale grid gap-3 rounded-md bg-background p-3" data-testid="branch-details-tab">
      <SettingsCard title="General Options" description="The branch name, logo, time zone and how the business day ends.">
        <SettingField id={id('branch-name')} label="Branch Name">
          <Input id={id('branch-name')} type="text" className="ws-control" value={branch.name || ''} onChange={e => set('name', e.target.value)} />
        </SettingField>
        <SettingField label="Image">
          <MediaLibrary
            handleFilesSelectCallback={files => onImageChange(transformAttachmentStructure(files, 'toIAttachment'))}
            defaultValues={transformAttachmentStructure(branch.logo ? [branch.logo] : [], 'toFileLibraryListItem')}
          />
        </SettingField>
        <SettingToggle
          id={id('clock-in-pin-only')}
          label="Clock-in with PIN only"
          description="Employees clock in with their PIN alone, without choosing their name first."
          checked={!!branch.clockInWithPinOnly}
          onChange={v => set('clockInWithPinOnly', v)}
        />
        <SettingToggle
          id={id('wholesale')}
          label="Enable Wholesale"
          description="This branch sells to wholesale customers."
          checked={!!branch.wholesale}
          onChange={v => set('wholesale', v)}
        />
        <SettingToggle
          id={id('ebt')}
          label="Is EBT Eligible"
          description="Customers can pay with EBT at this branch."
          checked={!!branch.ebteligible}
          onChange={v => set('ebteligible', v)}
        />
        <SettingField label="Time Zone">
          <Select
            aria-label="Time Zone"
            value={allTimeZones.find(tz => tz.ZoneId === branch.timeZone)}
            options={allTimeZones}
            getOptionLabel={option => `${option.Continent}/${option.City} (${option.ZoneId})`}
            getOptionValue={option => option.ZoneId}
            onChange={onTimeZoneChange}
            placeholder="Select time zone..."
            isClearable
            isSearchable
            className="text-xs"
          />
        </SettingField>
        <SettingToggle
          id={id('token')}
          label="Should token expire?"
          description="Signed-in POS sessions expire and staff must sign in again."
          checked={!!branch.tokenExpired}
          onChange={v => set('tokenExpired', v)}
        />
        <SettingField label="Ending Type" description="How the business day is closed.">
          <Select
            aria-label="Ending Type"
            value={branch.endingType ? { label: branch.endingType, value: branch.endingType } : null}
            options={Object.values(EndingType).map(type => ({ label: type, value: type }))}
            onChange={option => set('endingType', option?.value)}
            placeholder="Select Ending Type.."
            className="text-xs"
          />
        </SettingField>
        <SettingField label="Show End Of Day Report Section" description="Sections printed on the end of day report.">
          <Select
            aria-label="Show End Of Day Report Section"
            isMulti
            value={branch.endOfDayReportSection?.map(section => ({ value: section, label: section }))}
            onChange={onEndOfDayReportSectionChange}
            options={END_OF_DAY_SECTION_OPTIONS}
            className="text-xs"
          />
        </SettingField>
        <SettingField id={id('pos-home-page')} label="POS Home Page" description="Screen the POS shows after finalizing a sale or leaving a table.">
          <ShadSelect value={branch.posHomePage ?? PosHomePage.REGISTER} onValueChange={value => set('posHomePage', value)}>
            <SelectTrigger id={id('pos-home-page')} className="ws-control w-56">
              <SelectValue placeholder="Select POS home page" />
            </SelectTrigger>
            <SelectContent>
              {POS_HOME_PAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadSelect>
        </SettingField>
      </SettingsCard>

      <SettingsCard title="End of Day" description="Checks that must pass before the day can be closed.">
        <SettingToggle
          id={id('eod-untagged-deliveries')}
          label="Prevent EOD on Untagged Deliveries"
          description="Block the end of day while a delivery has no driver tagged."
          checked={false}
          soon
        />
        <SettingToggle
          id={id('eod-sales-clocked-in')}
          label="Prevent EOD if Employees with Sales are not Clocked-Out"
          description="Block the end of day while an employee who made sales is still clocked in."
          checked={false}
          soon
        />
        <SettingToggle
          id={id('eod-any-clocked-in')}
          label="Prevent EOD if any Employee is still Clocked-in"
          description="Block the end of day while anyone is still clocked in."
          checked={false}
          soon
        />
      </SettingsCard>

      <SettingsCard title="End of Shift" description="What happens when an employee clocks out.">
        <SettingToggle
          id={id('skip-shift-report')}
          label="Skip shift report on clock out"
          description="Clock out without showing the shift report."
          checked={!!branch.skipShiftReportOnClockOut}
          onChange={v => set('skipShiftReportOnClockOut', v)}
        />
        <SettingToggle
          id={id('print-time-sheet')}
          label="Print Time Sheet on Clocking out"
          description="Print the employee’s time sheet when they clock out."
          checked={false}
          soon
        />
        <SettingToggle
          id={id('force-print-eos')}
          label="Print End of Shift Sales on Clocking out"
          description="Print the employee’s end of shift sales report when they clock out."
          checked={branch.forcePrintEosReport !== false}
          onChange={v => set('forcePrintEosReport', v)}
        />
      </SettingsCard>

      <SettingsCard title="Online Ordering" description="Whether customers can order online, and what happens when an order is accepted.">
        <SettingToggle
          id={id('can-order')}
          label="Allow online ordering"
          description="Customers can place online orders with this branch."
          checked={branch.canOrder !== false}
          onChange={v => set('canOrder', v)}
        />
        <SettingToggle
          id={id('require-online-order-confirmation')}
          label="Require online order confirmation"
          description="Staff must accept each online order before it is prepared."
          checked={branch.requireOnlineOrderConfirmation !== false}
          onChange={v => set('requireOnlineOrderConfirmation', v)}
        />
        <SettingToggle
          id={id('use-order-promised-time-default')}
          label="Use order promised time as default prep option"
          description="When accepting, the prep time defaults to the time promised to the customer."
          checked={branch.useOrderPromisedTimeAsDefaultPrep !== false}
          onChange={v => set('useOrderPromisedTimeAsDefaultPrep', v)}
        />
        <SettingField id={id('online-order-prep-minutes')} label="Online order prep time options (minutes, comma-separated)">
          <Input
            id={id('online-order-prep-minutes')}
            type="text"
            className="ws-control w-56"
            defaultValue={(branch.onlineOrderPrepTimeOptionsMinutes || [15, 30, 45]).join(', ')}
            key={`prep-minutes-${branch.branchId}-${(branch.onlineOrderPrepTimeOptionsMinutes || []).join('-')}`}
            onBlur={e => onPrepTimeMinutesChange(e.target.value)}
            placeholder="15, 30, 45"
          />
        </SettingField>
        <SettingToggle
          id={id('auto-print-receipt-online')}
          label="Print receipt on online order accept"
          checked={branch.autoPrintReceiptOnOnlineAccept !== false}
          onChange={v => set('autoPrintReceiptOnOnlineAccept', v)}
        />
        <SettingToggle
          id={id('auto-print-kitchen-online')}
          label="Print kitchen ticket on online order accept"
          checked={branch.autoPrintKitchenOnOnlineAccept !== false}
          onChange={v => set('autoPrintKitchenOnOnlineAccept', v)}
        />
      </SettingsCard>

      <SettingsCard title="Delivery" description="How delivery orders are taken, dispatched, charged and printed.">
        <SettingToggle id={id('disable-delivery')} label="Disable Delivery" description="The branch does not take delivery orders." checked={false} soon />
        <SettingToggle id={id('own-drivers')} label="Use Delivery with own Drivers" description="Deliveries are handled by the branch’s own drivers." checked={false} soon />
        <SettingToggle id={id('tookan-delivery')} label="Use Delivery with Tookan Services" description="Deliveries are dispatched through Tookan." checked={false} soon />
        <SettingToggle
          id={id('keep-deliveries-unpaid')}
          label="Keep Deliveries as unpaid"
          description="When off, deliveries are closed as cash, to be adjusted later."
          checked
          soon
        />
        <SettingField id={id('delivery-minimum')} label="Minimum amount to Accept Deliveries" description="0 means no minimum." soon>
          <Input id={id('delivery-minimum')} type="number" className="ws-control ws-mono w-32" defaultValue="0.00" disabled />
        </SettingField>
        <SettingField id={id('delivery-charge-category')} label="Delivery Charge Default Category" soon>
          <ShadSelect disabled>
            <SelectTrigger id={id('delivery-charge-category')} className="ws-control w-56">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent />
          </ShadSelect>
        </SettingField>
        <SettingField id={id('delivery-waive-over')} label="Waive delivery fees for orders greater than" description="0 means delivery fees always apply." soon>
          <Input id={id('delivery-waive-over')} type="number" className="ws-control ws-mono w-32" defaultValue="0.00" disabled />
        </SettingField>
        <SettingToggle
          id={id('delivery-full-customer')}
          label="Print Full Customer Details for Delivery"
          description="When off, only the customer’s first and last name are printed."
          checked={false}
          soon
        />
      </SettingsCard>

      <SettingsCard title="Pick-up" description="How pick-up orders are printed.">
        <SettingToggle
          id={id('pickup-full-customer')}
          label="Print Full Customer Details for Pickup"
          description="When off, only the customer’s first and last name are printed."
          checked={false}
          soon
        />
      </SettingsCard>

      <SettingsCard title="Table Service" description="Opening, leaving and moving tables.">
        <SettingToggle
          id={id('ask-on-table-permissions')}
          label="Ask for permissions when opening a table"
          checked={!!branch.enableAskOnTablePermissions}
          onChange={v => set('enableAskOnTablePermissions', v)}
        />
        <SettingToggle
          id={id('open-table-idle-timeout')}
          label="Open table idle timeout"
          description="Leave an open table automatically after it has been idle."
          checked={!!branch.openTableIdleTimeoutEnabled}
          onChange={v => set('openTableIdleTimeoutEnabled', v)}
        />
        <SettingField id={id('open-table-idle-timeout-seconds')} label="Open table idle timeout (seconds)">
          <Input
            id={id('open-table-idle-timeout-seconds')}
            type="number"
            min={0}
            max={maxIdleTimeoutSeconds}
            step={1}
            className="ws-control ws-mono w-32"
            value={branch.openTableIdleTimeoutSeconds ?? ''}
            onChange={e => onIdleTimeoutSecondsChange(e.target.value)}
          />
        </SettingField>
        <SettingToggle
          id={id('exit-table-after-print-all')}
          label="Exit Table Automatically after Print All bills"
          checked
          soon
        />
        <SettingToggle id={id('move-printed-tables')} label="Allow Moving Printed Tables" checked={false} soon />
      </SettingsCard>

      <SettingsCard title="Pizza Settings" description="How pizzas can be split and offered.">
        <SettingToggle id={id('pizza-quarters')} label="Allow Quarters" checked={false} soon />
        <SettingToggle id={id('pizza-thirds')} label="Allow Thirds" checked={false} soon />
        <SettingToggle id={id('pizza-presets-in-deals')} label="Show Pre-Set Pizzas in Pizza Deals" checked={false} soon />
      </SettingsCard>

      <SettingsCard title="Customer Receipt" description="What is printed on the customer’s receipt.">
        {receiptText('receiptHeader', 'Header Section')}
        {receiptText('receiptFooter', 'Footer Section')}
        <div className="grid gap-4 sm:grid-cols-3">
          {receiptText('hstNumber', 'HST Number')}
          {receiptText('gstNumber', 'GST Number')}
          {receiptText('pstNumber', 'PST Number')}
        </div>
        <SettingToggle
          id={id('receipt-show-order-number')}
          label="Show Order Number on Receipt"
          checked={!!branch.receiptShowOrderNumber}
          onChange={v => set('receiptShowOrderNumber', v)}
        />
        <SettingToggle
          id={id('print-zero-price-addons')}
          label="Print Zero Priced Add-Ons"
          description="Add-ons with no price are printed on the receipt."
          checked={!!branch.printZeroPriceAddons}
          onChange={v => set('printZeroPriceAddons', v)}
        />
        <SettingToggle id={id('receipt-number-barcode')} label="Print Receipt Number as Barcode" checked={false} soon />
        <SettingToggle id={id('order-number-barcode')} label="Print Order number as barcode when saving an order" checked={false} soon />
      </SettingsCard>

      <SettingsCard title="Kitchen Tickets" description="Where orders go when sent to the kitchen, and how tickets are laid out.">
        <SettingField id={id('kitchen-output-mode')} label="Kitchen output" description="Send to kitchen uses printers, KDS, or both for this branch.">
          <ShadSelect value={branch.kitchenOutputMode ?? KitchenOutputMode.PRINT} onValueChange={value => set('kitchenOutputMode', value)}>
            <SelectTrigger id={id('kitchen-output-mode')} className="ws-control w-56">
              <SelectValue placeholder="Select kitchen output" />
            </SelectTrigger>
            <SelectContent>
              {KITCHEN_OUTPUT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadSelect>
        </SettingField>
        <SettingField id={id('kitchen-grouping')} label="Group Items by:">
          <ShadSelect value={branch.kitchenPrintGrouping || KitchenPrintGrouping.TIMESTAMP} onValueChange={value => set('kitchenPrintGrouping', value)}>
            <SelectTrigger id={id('kitchen-grouping')} className="ws-control w-56">
              <SelectValue placeholder="Grouping" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(KitchenPrintGrouping).map(grouping => (
                <SelectItem key={grouping} value={grouping} className="text-xs">
                  {GROUPING_LABEL[grouping]}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadSelect>
        </SettingField>
        <SettingToggle
          id={id('print-kitchen-reconciliation')}
          label="Print Items Consolidation"
          description="Print a summary of all items sent, after the kitchen tickets."
          checked={!!branch.printKitchenItemReconciliation}
          onChange={v => set('printKitchenItemReconciliation', v)}
        />
        <SettingToggle
          id={id('force-sending-by-course')}
          label="Force Sending by Course"
          checked={!!branch.forceSendingByCourse}
          onChange={v => set('forceSendingByCourse', v)}
        />
        <SettingToggle
          id={id('send-kitchen-on-pay')}
          label="Send to Kitchen on Pay Button Click"
          checked={!!branch.sendToKitchenOnPayButtonClick}
          onChange={v => set('sendToKitchenOnPayButtonClick', v)}
        />
        <SettingToggle id={id('kitchen-dollar-sign')} label="Print Dollar Sign for items with price" checked={false} soon />
      </SettingsCard>

      <SettingsCard title="KDS Settings" description="Kitchen display screen options." soon>
        <p className="m-0 text-xs text-muted-foreground">KDS options will appear here.</p>
      </SettingsCard>

      <SettingsCard title="Payments" description="Payment types available at this branch. Card gateways are set in the Payment Configuration tab.">
        <SettingToggle
          id={id('cod')}
          label="Cash on delivery (COD)"
          description="Staff and online ordering can accept cash paid to the driver at drop-off."
          checked={!!branch.activeCOD}
          onChange={v => set('activeCOD', v)}
        />
        <SettingToggle
          id={id('wallet')}
          label="Wallet (store credit)"
          description="Signed-in customers can pay from their wallet balance at online checkout."
          checked={branch.activeWallet !== false}
          onChange={v => set('activeWallet', v)}
        />
        <SettingToggle
          id={id('loyalty')}
          label="Loyalty points"
          description="Signed-in customers can redeem loyalty points at online checkout. Needs a points-to-cash rate in loyalty settings."
          checked={branch.activeLoyalty !== false}
          onChange={v => set('activeLoyalty', v)}
        />
        <SettingToggle
          id={id('cashback-enabled')}
          label="Enable Cash-Back"
          description="Cashiers can give cash back on card payments at the POS."
          checked={branch.cashbackEnabled !== false}
          onChange={v => set('cashbackEnabled', v)}
        />
      </SettingsCard>

      <SettingsCard title="Gift Cards" description="Which branches a card works at is chosen on each card. This setting decides whether this branch settles gift card money with other branches.">
        <SettingToggle
          id={id('share-gift-cards')}
          label="Share gift cards with other branches"
          description="When a card is spent here with money another sharing branch took in, that branch owes the amount to this branch. See Reports, Gift Card Settlement."
          checked={!!branch.shareGiftCards}
          onChange={v => set('shareGiftCards', v)}
        />
      </SettingsCard>
    </div>
  );
};

export default BranchDetailsTab;
