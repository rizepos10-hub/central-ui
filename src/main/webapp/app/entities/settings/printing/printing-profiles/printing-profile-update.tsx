import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPrintingProfile } from 'app/shared/model/PRINTER/printing-profile.model';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './printing-profile.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getPrinters } from 'app/entities/settings/printing/printer/printer.reducer';

import Select from 'react-select';
import { getSortState, Translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IBranch } from 'app/shared/model/branch.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export const PrintingProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printersList = useAppSelector(state => state.printer.entities);
  const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const printingProfile: IPrintingProfile = useAppSelector(state => state.printingProfiles.entity);
  const updating = useAppSelector(state => state.printingProfiles.updating);

  const saveEntity = (createNew = false) => {
    const formData = {
      ...printingProfile,
    };

    if (isNew) {
      dispatch(createEntity(formData)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/printing-profiles/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(formData)).then(() => {
        if (createNew) {
          navigate(`/printing-profiles/new`)
        }
      })
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getPrinters({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    dispatch(
      getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  const togglePrinterSelection = (printerId) => {
    const selectedPrinter = printersList.find((printer) => printer.id === printerId);
    if (!selectedPrinter) return;

    const updatedPrinters = printingProfile.printers || [];
    const printerIndex = updatedPrinters.findIndex((printer) => printer.id === printerId);

    let newPrinters;
    if (printerIndex !== -1) {
      newPrinters = updatedPrinters.filter((printer) => printer.id !== printerId);
    } else {
      newPrinters = [...updatedPrinters, { id: selectedPrinter.id, label: selectedPrinter.name, value: selectedPrinter.id }];
    }
    dispatch(changeEntityField({ name: 'printers', value: newPrinters }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {isNew ? `Add New Printing Profile` : `Edit Printing Profile ${printingProfile.name}`}
      </h2>

      <div className="max-w-2xl bg-white p-4 rounded-lg border">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input
              id="name"
              value={printingProfile?.name || ''}
              onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
              required
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-bold">Selected Printers</label>
              {printersList
                ?.filter(printer => printingProfile?.printers?.some(selectedPrinter => selectedPrinter.id === printer.id))
                .map(printer => (
                  <div key={printer.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={printingProfile.printers?.some(selectedPrinter => selectedPrinter.id === printer.id)}
                      onCheckedChange={(checked) => togglePrinterSelection(printer.id)}
                    />
                    <label className="text-sm font-bold">{printer.name}</label>
                  </div>
                ))}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold">Other Printers</label>
              {printersList
                ?.filter(printer => !printingProfile.printers?.some(selectedPrinter => selectedPrinter.id === printer.id))
                .map(printer => (
                  <div key={printer.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={false}
                      onCheckedChange={(checked) => togglePrinterSelection(printer.id)}
                    />
                    <label className="text-sm font-bold">{printer.name}</label>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="accountingId" className="text-sm font-medium">Branches</label>
            <Select
              value={printingProfile.branch || null}
              options={branchList}
              getOptionLabel={(option: IBranch) => option.name}
              getOptionValue={(option: IBranch) => option.id}
              required
              onChange={(selectedBranch: IBranch) => dispatch(changeEntityField({ name: 'branch', value: selectedBranch }))}
              styles={{
                control: (base) => ({ ...base, minHeight: '28px', height: '28px', fontSize: '12px' }),
                valueContainer: (base) => ({ ...base, height: '28px', padding: '0 6px' }),
                input: (base) => ({ ...base, margin: '0', padding: '0' }),
                indicatorsContainer: (base) => ({ ...base, height: '28px' }),
              }}
            />
          </div>

          <div className="flex items-center gap-2 mt-6">
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              <Translate contentKey="entity.action.back">Back</Translate>
            </Button>
            <Button
              className="h-8 text-xs"
              onClick={() => saveEntity(false)}
              disabled={updating}
            >
              <Save className="h-4 w-4" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
            <Button
              className="h-8 text-xs"
              onClick={() => saveEntity(true)}
              disabled={updating}
            >
              <Save className="h-4 w-4" />
              <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingProfileUpdate;
