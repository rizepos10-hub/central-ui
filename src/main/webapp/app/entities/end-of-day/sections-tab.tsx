import React, { useState, useEffect } from 'react';
import { EndOfDaySection } from 'app/shared/model/end-of-day-config.model';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Translate } from 'react-jhipster';

interface SectionsTabProps {
  defaultSections: EndOfDaySection[];
  onSelectionChange: (sections: EndOfDaySection[]) => void;
}

const ALL_SECTIONS: EndOfDaySection[] = [
  'SALES',
  'PAYMENTS',
  'CASH_SALES',
  'GROSS_SALES',
  'CATEGORY_SALES',
  'STATISTICS',
  'TIPS_OUT',
  'ORDER_METHODS',
  'TENDER_SUMMARY',
  'TENDER_RECONCILIATION',
  'SALES_SUMMARY',
  'SALES_BY_TAX',
  'SALES_BY_CATEGORY',
  'SALES_BY_TAG',
  'SALES_BY_PRICING_POINT',
  'SALES_BY_ORDER_TYPE',
  'SALES_BY_STATION',
  'SALES_BY_ITEM',
  'SALES_BY_EMPLOYEE',
  'DELIVERY_PERFORMANCE',
  'SERVICE_CHARGE_SUMMARY',
  'PAYOUT_SUMMARY',
  'DRIVER_FEES_SUMMARY',
  'VOIDED_TICKETS',
  'HOURLY_SALES_SUMMARY',
  'NEW_CUSTOMERS',
  'DISCOUNT_DETAILS',
  'COUPON_DETAILS',
  'DEPOSIT_SUMMARY',
  'DEPOSIT_DETAILS'
];

const formatSectionName = (section: string): string => {
  return section
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export const SectionsTab: React.FC<SectionsTabProps> = ({ defaultSections, onSelectionChange }) => {
  const [selectedSections, setSelectedSections] = useState<EndOfDaySection[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize with default sections only once
  useEffect(() => {
    if (!initialized && defaultSections && defaultSections.length > 0) {
      console.log('[sections-tab.tsx] Initializing with defaultSections:', defaultSections);
      setSelectedSections(defaultSections);
      setInitialized(true);
    }
  }, [defaultSections, initialized]);

  // Call parent callback when sections change
  useEffect(() => {
    console.log('[sections-tab.tsx] selectedSections changed:', selectedSections, 'initialized:', initialized);
    if (initialized) {
      console.log('[sections-tab.tsx] Calling onSelectionChange with:', selectedSections);
      onSelectionChange(selectedSections);
    }
  }, [selectedSections, initialized, onSelectionChange]);

  const toggleSection = (section: EndOfDaySection) => {
    console.log('[sections-tab.tsx] toggleSection called:', section);
    setSelectedSections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      console.log('[sections-tab.tsx] New sections after toggle:', newSections);
      return newSections;
    });
  };

  const selectAll = () => {
    console.log('[sections-tab.tsx] selectAll called');
    setSelectedSections([...ALL_SECTIONS]);
  };

  const unselectAll = () => {
    console.log('[sections-tab.tsx] unselectAll called');
    setSelectedSections([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={selectAll} variant="outline" size="sm">
          <Translate contentKey="endOfDay.selectAll">Select All</Translate>
        </Button>
        <Button onClick={unselectAll} variant="outline" size="sm">
          <Translate contentKey="endOfDay.unselectAll">Unselect All</Translate>
        </Button>
        <span className="text-sm text-muted-foreground ml-auto flex items-center">
          {selectedSections.length} / {ALL_SECTIONS.length} <Translate contentKey="endOfDay.selected">selected</Translate>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_SECTIONS.map((section) => (
          <div
            key={section}
            className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
              selectedSections.includes(section)
                ? 'bg-primary/5 border-primary'
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            <Checkbox
              id={section}
              checked={selectedSections.includes(section)}
              onCheckedChange={() => toggleSection(section)}
            />
            <Label
              htmlFor={section}
              className="text-sm font-normal cursor-pointer flex-1"
            >
              {formatSectionName(section)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
