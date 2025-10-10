import React from 'react';
import { Translate } from 'react-jhipster';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface EBTEligibleBranchesProps {
  item: IItem; // Can be IRegularItem, IComboItem, IPizzaItem, or IProduct
  setItem: (updater: (prev: IItem) => IItem) => void;
  branchList: IBranch[];
}

const EBTEligibleBranches: React.FC<EBTEligibleBranchesProps> = ({ item, setItem, branchList }) => {

  // Handler for EBT branch selection/deselection
  const handleEBTEligibleBranchChange = (branchId: string, isSelected: boolean) => {
    setItem(prev => {
      const currentEbtBranches = prev.ebtEligibleByBranch || [];

      if (isSelected) {
        // Add branch if not already in the set
        const branch = getEBTEligibleBranches().find(b => b.id === branchId);
        if (branch && !currentEbtBranches.some(eb => eb.branch.id === branchId)) {
          return {
            ...prev,
            ebtEligibleByBranch: [
              ...currentEbtBranches,
              {
                 branch: { id: branchId, name: branch.name },
                 ebtEligible: true
              }
            ]
          };
        }
      } else {
        // Remove branch from the set
        return {
          ...prev,
          ebtEligibleByBranch: currentEbtBranches.filter(eb => eb.branch.id !== branchId)
        };
      }

      return prev;
    });
  };

  // Get branches that have ebtEligible = true
  const getEBTEligibleBranches = () => {
    return branchList?.filter(branch => branch.ebtEligible === true) || [];
  };

  // Check if a branch is selected for EBT
  const isEBTBranchSelected = (branchId: string) => {
    return item.ebtEligibleByBranch?.some(eb => eb.branch.id === branchId) || false;
  };

  return (
    <div className="w-full">
      <div className="text-base font-semibold mb-3">
        <Translate contentKey="items.update.tabs.ebtEligibleBranches.title">EBT Eligible Branches</Translate>
      </div>

      {getEBTEligibleBranches().length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-xs text-yellow-800">
            <Translate contentKey="items.update.tabs.ebtEligibleBranches.noBranches">
              No branches are configured as EBT eligible. Please configure branches in Business Details first.
            </Translate>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            <Translate contentKey="items.update.tabs.ebtEligibleBranches.description">
              Select the branches where this item is eligible for EBT payment.
            </Translate>
          </div>

          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs h-8 font-semibold p-2">
                    <Translate contentKey="items.update.tabs.ebtEligibleBranches.branchName">Branch Name</Translate>
                  </TableHead>
                  <TableHead className="text-xs h-8 font-semibold p-2">
                    <Translate contentKey="items.update.tabs.ebtEligibleBranches.eligible">EBT Eligible</Translate>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getEBTEligibleBranches().map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="text-xs p-2">{branch.name}</TableCell>
                    <TableCell className="text-xs p-2">
                      <Checkbox
                        checked={isEBTBranchSelected(branch.id)}
                        onCheckedChange={(checked) => handleEBTEligibleBranchChange(branch.id, checked as boolean)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {item.ebtEligibleByBranch && item.ebtEligibleByBranch.length > 0 && (
            <div className="mt-3 space-y-2">
              <Label className="text-xs font-semibold">
                <Translate contentKey="items.update.tabs.ebtEligibleBranches.selectedBranches">Selected Branches:</Translate>
              </Label>
              <div className="flex flex-wrap gap-2">
                {item.ebtEligibleByBranch.map((ebtBranch) => (
                  <Badge key={ebtBranch.branch.id} variant="default" className="text-xs">
                    {ebtBranch.branch.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EBTEligibleBranches;
