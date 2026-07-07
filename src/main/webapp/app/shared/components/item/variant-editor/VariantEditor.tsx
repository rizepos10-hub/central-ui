import React, { Dispatch, SetStateAction } from 'react';
import { translate } from 'react-jhipster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IBranch } from 'app/shared/model/branch.model';
import { IDiscount } from 'app/shared/model/discount.model';
import { IMixAndMatchRule } from 'app/shared/model/mix-and-match-rule.model';
import { IProfileGroup } from 'app/shared/model/TAX/profile-group.model';
import { IScheduledBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';
import VariantGeneralTab from './VariantGeneralTab';
import VariantPricingTab from './VariantPricingTab';
import VariantBranchPricesTab from './VariantBranchPricesTab';
import VariantDetailHeader from './VariantDetailHeader';

export interface ExtraTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface VariantEditorProps {
  variant: any;
  variantIndex: number;
  itemVariantType: 'RETAIL' | 'RESTAURANT' | 'VIRTUAL_GIFTCARD';
  branchList: IBranch[];
  setItem: Dispatch<SetStateAction<any>>;

  handleVariantFieldChange: (variantIndex: number, field: string, value: any) => void;
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number | null) => void;
  handleHideItemPerBranch: (branchId: string, variantIndex: number, field: 'hideItem' | 'hideOnline') => void;
  handleSaveScheduledPrices: (variantIndex: number, branchId: string, prices: IScheduledBranchPrice[]) => void;

  mixAndMatchRuleList?: IMixAndMatchRule[];
  profileGroupsOptions?: IProfileGroup[];

  showName?: boolean;
  showSku?: boolean;
  showDescription?: boolean;
  showPrice?: boolean;
  showSalePrice?: boolean;
  showProfileGroups?: boolean;
  showFormErrors?: boolean;

  generalTabContent?: React.ReactNode;
  pricingTabContent?: React.ReactNode;
  extraTabs?: ExtraTab[];

  defaultTab?: string;
  onDeleteVariant?: () => void;
  canDeleteVariant?: boolean;
  variantLabel?: string;
}

export const VariantEditor = ({
  variant,
  variantIndex,
  itemVariantType,
  branchList,
  setItem,
  handleVariantFieldChange,
  handleBranchPriceChange,
  handleHideItemPerBranch,
  handleSaveScheduledPrices,
  mixAndMatchRuleList = [],
  profileGroupsOptions = [],
  showName = false,
  showSku = false,
  showDescription = true,
  showPrice = false,
  showSalePrice = false,
  showProfileGroups = false,
  showFormErrors = false,
  generalTabContent,
  pricingTabContent,
  extraTabs = [],
  defaultTab = 'general',
  onDeleteVariant,
  canDeleteVariant = true,
  variantLabel,
}: VariantEditorProps) => {
  const onFieldChange = (field: string, value: any) => {
    handleVariantFieldChange(variantIndex, field, value);
  };

  const hasGeneralContent =
    showName || showSku || showDescription || showPrice || showSalePrice || generalTabContent;

  const hasPricingContent = showProfileGroups || pricingTabContent;

  const displayLabel = variantLabel || variant?.name || `Variant ${variantIndex + 1}`;

  const tabCount = (hasGeneralContent ? 1 : 0) + 2 + extraTabs.length;
  const tabTriggerClass = 'text-xs h-7 w-full';

  return (
    <div className="w-full">
      {onDeleteVariant && (
        <VariantDetailHeader
          label={displayLabel}
          onDelete={onDeleteVariant}
          canDelete={canDeleteVariant}
        />
      )}
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList
        className="w-full h-auto grid p-1 mb-2"
        style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
      >
        {hasGeneralContent && (
          <TabsTrigger value="general" className={tabTriggerClass}>
            {translate('items.update.tabs.general', null, 'General')}
          </TabsTrigger>
        )}
        <TabsTrigger value="pricing" className={tabTriggerClass}>
          {translate('items.update.tabs.pricing', null, 'Pricing')}
        </TabsTrigger>
        <TabsTrigger value="branch-prices" className={tabTriggerClass}>
          {translate('items.update.tabs.branchPrices', null, 'Branch Prices')}
        </TabsTrigger>
        {extraTabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id} className={tabTriggerClass}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {hasGeneralContent && (
        <TabsContent value="general" className="w-full">
          <VariantGeneralTab
            name={variant?.name}
            sku={variant?.sku}
            description={variant?.description}
            price={variant?.price}
            salePrice={variant?.salePrice}
            showName={showName}
            showSku={showSku}
            showDescription={showDescription}
            showPrice={showPrice}
            showSalePrice={showSalePrice}
            showFormErrors={showFormErrors}
            onFieldChange={onFieldChange}
          >
            {generalTabContent}
          </VariantGeneralTab>
        </TabsContent>
      )}

      <TabsContent value="pricing" className="w-full">
        <VariantPricingTab
          price={variant?.price}
          salePrice={variant?.salePrice}
          discounts={variant?.discounts}
          mixAndMatchRule={variant?.mixAndMatchRule}
          accountingGroups={variant?.accountingGroups}
          showProfileGroups={showProfileGroups}
          mixAndMatchRuleList={mixAndMatchRuleList}
          profileGroupsOptions={profileGroupsOptions}
          showFormErrors={showFormErrors}
          variantIndex={variantIndex}
          onFieldChange={onFieldChange}
          onVariantFieldChange={handleVariantFieldChange}
        >
          {pricingTabContent}
        </VariantPricingTab>
      </TabsContent>

      <TabsContent value="branch-prices" className="w-full">
        <VariantBranchPricesTab
          variant={variant}
          variantIndex={variantIndex}
          branchList={branchList}
          branchVariantDetails={variant?.branchVariantDetails}
          itemVariantType={itemVariantType}
          handleBranchPriceChange={handleBranchPriceChange}
          handleHideItemPerBranch={handleHideItemPerBranch}
          handleSaveScheduledPrices={handleSaveScheduledPrices}
          setItem={setItem}
        />
      </TabsContent>

      {extraTabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className="w-full">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
    </div>
  );
};

export default VariantEditor;
