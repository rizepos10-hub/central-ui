import React, { useEffect, useReducer, useState } from 'react';
import { Save, X, ArrowLeft } from 'lucide-react';
import { createEntity, getEntity, reset, updateEntity } from "app/entities/settings/tax/tax.reducer";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';


const initialState = {
  id: null,
  code: '',
  description: '',
  value: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };

    case 'SET_VALUE':
      return { ...state, value: action.payload };

    case 'SET_ID':
      return { ...state, id: action.payload };
    default:
      return state;
  }
};
const AddTaxModal = ({ visible, onHide, taxId= null }) => {

  const [state, dispatch] = useReducer(reducer, initialState);
  const isNew = taxId === null;

  const dispatchAction = useAppDispatch()

  const [next, setNext] = useState(false);

  const taxEntity = useAppSelector(state => state.tax.entity);
  const loading = useAppSelector(state => state.tax.loading);
  const updating = useAppSelector(state => state.tax.updating);
  const updateSuccess = useAppSelector(state => state.tax.updateSuccess);

  console.log(taxEntity, 'lolo')

  const handleInputChange = (field, value) => {
    dispatch({ type: `SET_${field}`, payload: value });
  };

  const handleNextClick = () => {
    if (state.code && state.description && state.value) {
      setNext(true);
    } else {
      alert("Please fill in all required fields (Code, Description, Value) before proceeding.");
    }
  };

  const handleSubmit = () => {
    console.log(state, 'meso')
    if (state.code && state.description && state.value) {
      if (isNew) {
        dispatchAction(createEntity(state));
      } else {
        dispatchAction(updateEntity( state));
      }

      onHide();
    } else {
      alert('Please fill in all required fields (Code, Description, value) before submitting.');
    }
  };
  const handleClose = () => {
    setNext(false);
    onHide();
  };

  useEffect(() => {

    if (taxId !== null) {
      dispatchAction(getEntity(taxId));
    }
  }, []);

  useEffect(() => {
    if (taxEntity && taxId !== null) {
      dispatch({ type: 'SET_CODE', payload: taxEntity.code });
      dispatch({ type: 'SET_DESCRIPTION', payload: taxEntity.description });
      dispatch({ type: 'SET_VALUE', payload: taxEntity.value });
      dispatch({ type: 'SET_ID', payload: taxEntity.id });
    }

  }, [taxEntity.code]);


  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Add a New Tax</DialogTitle>
        </DialogHeader>
        {!next ? (
          <div className="space-y-4">
            <Alert className="py-2">
              <AlertDescription className="text-xs">
                Code, description, and value are required. Note that you cannot delete a tax after adding it.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold">Code</Label>
              <Input
                id="code"
                placeholder="Enter code"
                value={state.code || ''}
                readOnly={!isNew}
                onChange={(e) => handleInputChange('CODE', e.target.value)}
                className="h-7 text-xs"
              />
              <p className="text-xs text-muted-foreground">You cannot edit the code after saving</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={state.description || ''}
                onChange={(e) => handleInputChange('DESCRIPTION', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value" className="text-xs font-semibold">Value (%)</Label>
              <Input
                id="value"
                placeholder="Enter value"
                value={state.value || ''}
                onChange={(e) => handleInputChange('VALUE', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="py-2">
              <AlertDescription className="text-xs">
                You cannot delete a tax after adding it.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Code</span>
                <span className="text-sm">{state.code}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Description</span>
                <span className="text-sm">{state.description}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Accounting reference</span>
                <span className="text-sm">{state.accountingReference}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-semibold text-sm">Value (%)</span>
                <span className="text-sm">{state.value}</span>
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
          <Button onClick={!next ? handleNextClick : handleSubmit} className="h-8 text-xs">
            <Save className="h-4 w-4 mr-2" />
            {next ? 'Submit' : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaxModal;
