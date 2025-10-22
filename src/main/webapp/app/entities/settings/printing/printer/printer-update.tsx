import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './printer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from "react-select";
import { IBranch } from "app/shared/model/branch.model";
import { IPrinter } from "app/shared/model/PRINTER/printer.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export const PrinterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const CONNECTION_TYPES: IPrinter["connectionType"][] = ["NETWORK", "USB"];
  const SIZES: IPrinter["size"][] = ["mm72", "mm80", "mm58"];


  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printerEntity: IPrinter = useAppSelector(state => state.printer.entity);
  const loading = useAppSelector(state => state.printer.loading);
  const updating = useAppSelector(state => state.printer.updating);
  const branchList = useAppSelector(state => state.branch.entities)

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));

    }
    dispatch(getBranches({
      page: 0,
      size: 400,
      sort: `id,asc`,
    }));

  }, []);

  const saveEntity = (createNew = false) => {
    const entity = {
      ...printerEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/printer/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/printer/new`)
        }
      })
    }
  };

  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-4">
        <Translate contentKey="tempApp.printer.home.createOrEditLabel">Create or edit a Printer</Translate>
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4 bg-white p-4 rounded-md border">
          <div className="space-y-2">
            <Label htmlFor="printer-name" className="text-sm">{translate('tempApp.printer.name')}</Label>
            <Input
              id="printer-name"
              value={printerEntity.name || ""}
              onChange={e => dispatch(changeEntityField({ name: 'name', value: e.target.value }))}
              required
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-brand" className="text-sm">{translate('tempApp.printer.brand')}</Label>
            <Input
              id="printer-brand"
              value={printerEntity.brand || ""}
              onChange={e => dispatch(changeEntityField({ name: 'brand', value: e.target.value }))}
              required
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-model" className="text-sm">{translate('tempApp.printer.model')}</Label>
            <Input
              id="printer-model"
              value={printerEntity.model || ""}
              onChange={e => dispatch(changeEntityField({ name: 'model', value: e.target.value }))}
              required
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-connectionType" className="text-sm">{translate('tempApp.printer.connectionType')}</Label>
            <ShadcnSelect
              value={printerEntity?.connectionType || "NETWORK"}
              onValueChange={(value) => {
                dispatch(changeEntityField({ name: 'connectionType', value: value as IPrinter["connectionType"] }));
                dispatch(changeEntityField({ name: 'ipAddress', value: null }));
                dispatch(changeEntityField({ name: 'port', value: null }));
                dispatch(changeEntityField({ name: 'serviceName', value: null }));
              }}
            >
              <SelectTrigger className="h-7 text-xs min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          {printerEntity?.connectionType === "NETWORK" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="printer-ipAddress" className="text-sm">{translate('tempApp.printer.ipAddress')}</Label>
                <Input
                  id="printer-ipAddress"
                  value={printerEntity.ipAddress || ""}
                  onChange={e => dispatch(changeEntityField({ name: 'ipAddress', value: e.target.value }))}
                  required
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer-port" className="text-sm">{translate('tempApp.printer.port')}</Label>
                <Input
                  id="printer-port"
                  type="number"
                  value={printerEntity.port || 0}
                  onChange={e => dispatch(changeEntityField({ name: 'port', value: parseInt(e.target.value) || 0 }))}
                  required
                  className="h-7 text-xs"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="printer-serviceName" className="text-sm">{translate('tempApp.printer.serviceName')}</Label>
              <Input
                id="printer-serviceName"
                value={printerEntity.serviceName || ""}
                onChange={e => dispatch(changeEntityField({ name: 'serviceName', value: e.target.value }))}
                required
                className="h-7 text-xs"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="printer-printSpeed" className="text-sm">{translate('tempApp.printer.printSpeed')}</Label>
            <Input
              id="printer-printSpeed"
              type="number"
              value={printerEntity.printSpeed || 0}
              onChange={e => dispatch(changeEntityField({ name: 'printSpeed', value: parseInt(e.target.value) || 0 }))}
              required
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-branch" className="text-sm">{translate('tempApp.printer.branch')}</Label>
            <Select
              name={"printer-branch"}
              options={branchList}
              getOptionLabel={(option: IBranch) => option.name}
              getOptionValue={(option: IBranch) => option.id}
              value={printerEntity?.branch || null}
              placeholder="Branch Name"
              onChange={(selectedBranch: IBranch) => dispatch(changeEntityField({ name: 'branch', value: selectedBranch }))}
              styles={{
                control: (base) => ({ ...base, minHeight: '28px', height: '28px', fontSize: '12px' }),
                valueContainer: (base) => ({ ...base, height: '28px', padding: '0 6px' }),
                input: (base) => ({ ...base, margin: '0', padding: '0' }),
                indicatorsContainer: (base) => ({ ...base, height: '28px' }),
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-size" className="text-sm">{translate('tempApp.printer.size')}</Label>
            <ShadcnSelect
              value={printerEntity?.size || "mm72"}
              onValueChange={(value) => dispatch(changeEntityField({ name: 'size', value: value as IPrinter["size"] }))}
            >
              <SelectTrigger className="h-7 text-xs min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printer-colorPrinter"
              checked={printerEntity?.colorPrinter === true}
              onCheckedChange={(checked) => dispatch(changeEntityField({ name: 'colorPrinter', value: checked === true }))}
            />
            <Label htmlFor="printer-colorPrinter" className="text-sm cursor-pointer">
              {translate('tempApp.printer.colorPrinter')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="printer-reverse"
              checked={printerEntity?.reverse === true}
              onCheckedChange={(checked) => dispatch(changeEntityField({ name: 'reverse', value: checked === true }))}
            />
            <Label htmlFor="printer-reverse" className="text-sm cursor-pointer">
              {translate('tempApp.printer.reverse')}
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="h-8 text-xs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.back">Back</Translate>
            </Button>
            <Button onClick={() => saveEntity()} disabled={updating} className="h-8 text-xs">
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
            <Button onClick={() => saveEntity(true)} disabled={updating} className="h-8 text-xs">
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterUpdate;
