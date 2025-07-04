import React from 'react';
import { Table } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { Checkbox } from 'primereact/checkbox';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';

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
    <div className="w-100">
      <div className="text-xl font-semibold mb-3">
        <Translate contentKey="items.update.tabs.ebtEligibleBranches.title">EBT Eligible Branches</Translate>
      </div>
      
      {getEBTEligibleBranches().length === 0 ? (
        <div className="alert alert-warning">
          <Translate contentKey="items.update.tabs.ebtEligibleBranches.noBranches">
            No branches are configured as EBT eligible. Please configure branches in Business Details first.
          </Translate>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          <div className="text-sm text-muted">
            <Translate contentKey="items.update.tabs.ebtEligibleBranches.description">
              Select the branches where this item is eligible for EBT payment.
            </Translate>
          </div>
          
          <Table responsive>
            <thead>
              <tr>
                <th>
                  <Translate contentKey="items.update.tabs.ebtEligibleBranches.branchName">Branch Name</Translate>
                </th>
                <th>
                  <Translate contentKey="items.update.tabs.ebtEligibleBranches.eligible">EBT Eligible</Translate>
                </th>
              </tr>
            </thead>
            <tbody>
              {getEBTEligibleBranches().map((branch) => (
                <tr key={branch.id}>
                  <td>{branch.name}</td>
                  <td>
                    <Checkbox
                      checked={isEBTBranchSelected(branch.id)}
                      onChange={(e) => handleEBTEligibleBranchChange(branch.id, e.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {item.ebtEligibleByBranch && item.ebtEligibleByBranch.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-semibold mb-2">
                <Translate contentKey="items.update.tabs.ebtEligibleBranches.selectedBranches">Selected Branches:</Translate>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {item.ebtEligibleByBranch.map((ebtBranch) => (
                  <span key={ebtBranch.branch.id} className="badge bg-primary">
                    {ebtBranch.branch.name}
                  </span>
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