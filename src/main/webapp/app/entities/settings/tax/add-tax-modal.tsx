import React, { useEffect, useState } from "react";
import { Save, X, ArrowLeft } from 'lucide-react';
import { createEntity, getEntity, resetEntity, updateEntity, changeEntityField } from "app/entities/settings/tax/tax.reducer";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { ITax } from "app/shared/model/TAX/tax.model";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';



const AddTaxModal = ({ visible, onHide, taxId = null }) => {

  const isNew = taxId === null;
  const dispatch = useAppDispatch()
  const [next, setNext] = useState(false);


  const taxEntity: ITax = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);


  const handleChange = <K extends keyof ITax>(fieldName: K, value: ITax[K]) => {
    dispatch(changeEntityField({ fieldName, value }));
  };

  const allFieldsFilled = taxEntity.code && taxEntity.description && taxEntity.value;

  const handleClose = () => {
    setNext(false);
    onHide();
  };

  const handleNextClick = () => {
    if (allFieldsFilled) {
      setNext(true);
    } else {
      alert("Please fill in all required fields (Code, Description, Value) before proceeding.");
    }
  };


  const handleSubmit = () => {
    const entity: ITax = {
      ...taxEntity
    }
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }

    onHide();
  };

  const fetchTaxEntity = () => {
    if (!isNew && taxId !== null) {
      dispatch(getEntity(taxId));
    }
  };

  useEffect(() => {
    fetchTaxEntity();


  }, [taxId]);



  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{isNew ? 'Add a New Tax' : 'Edit Tax'}</DialogTitle>
        </DialogHeader>
        {!next ? (
          <div className="space-y-4">
            {isNew && (
              <Alert className="py-2">
                <AlertDescription className="text-xs">
                  Code, description, and value are required. Note that you cannot delete a tax after adding it.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold">Code</Label>
              <Input
                id="code"
                placeholder="Enter code"
                value={taxEntity.code || ''}
                readOnly={!isNew}
                onChange={(e) => handleChange('code', e.target.value)}
                className="h-7 text-xs"
              />
              <p className="text-xs text-muted-foreground">You cannot edit the code after saving</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={taxEntity.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value" className="text-xs font-semibold">Value (%)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="Enter value"
                value={taxEntity.value || ''}
                onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isNew && (
              <Alert className="py-2">
                <AlertDescription className="text-xs">
                  You cannot delete a tax after adding it.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Code</span>
                <span className="text-sm">{taxEntity.code}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Description</span>
                <span className="text-sm">{taxEntity.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Value (%)</span>
                <span className="text-sm">{taxEntity.value}</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {next && (
            <Button variant="secondary" onClick={() => setNext(false)} className="h-8 text-xs mr-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="secondary" onClick={handleClose} className="h-8 text-xs">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={!next ? handleNextClick : handleSubmit} disabled={updating} className="h-8 text-xs">
            <Save className="h-4 w-4 mr-2" />
            {next ? 'Submit' : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaxModal;
