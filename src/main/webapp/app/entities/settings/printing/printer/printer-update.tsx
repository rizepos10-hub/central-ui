import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './printer.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import { IBranch } from "app/shared/model/branch.model";
import { IPrinter } from "app/shared/model/PRINTER/printer.model";
import { findPrinterModel, fontsFor, methodsFor, PRINTER_BRANDS, PRINTER_MODELS, PrinterCommandMode } from "app/shared/model/PRINTER/printer-models";
import { applyKitchenFontDefaults, defaultKitchenLayout, fitKitchenLayoutToPrinter, KitchenLayoutEditor } from './kitchen-layout-editor';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_MODEL = '__none__';


export const PrinterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const CONNECTION_TYPES: IPrinter["connectionType"][] = ["NETWORK", "USB"];
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const printerEntity: IPrinter = useAppSelector(state => state.printer.entity);
  const loading = useAppSelector(state => state.printer.loading);
  const updating = useAppSelector(state => state.printer.updating);
  const branchList = useAppSelector(state => state.branch.entities)

  const selectedModel = findPrinterModel(printerEntity?.modelId);
  const selectedBrand = selectedModel?.brand || printerEntity?.brand || '';
  const brandModels = PRINTER_MODELS.filter(model => model.brand === selectedBrand);
  const methods = methodsFor(selectedModel);
  const commandMode: PrinterCommandMode = methods.includes(printerEntity?.commandMode as PrinterCommandMode)
    ? (printerEntity.commandMode as PrinterCommandMode)
    : methods[0];
  const paperSize = selectedModel?.size || printerEntity?.size || 'mm72';
  const paperColumns = commandMode === 'WINDOWS_DRIVER' ? null : selectedModel?.fontAColumns;

  const handleBrandChange = (value: string) => {
    dispatch(changeEntityField({ name: 'brand', value }));
    if (selectedModel && selectedModel.brand !== value) {
      dispatch(changeEntityField({ name: 'modelId', value: null }));
      dispatch(changeEntityField({ name: 'model', value: '' }));
      dispatch(changeEntityField({ name: 'charsPerLine', value: null }));
    }
  };

  const handleModelChange = (value: string) => {
    const model = findPrinterModel(value);
    dispatch(changeEntityField({ name: 'modelId', value: model?.id ?? null }));
    if (!model) {
      const kitchen = printerEntity.kitchenComponents?.length ? printerEntity.kitchenComponents : defaultKitchenLayout(commandMode);
      dispatch(changeEntityField({ name: 'kitchenComponents', value: applyKitchenFontDefaults(kitchen, commandMode) }));
      return;
    }
    const nextMethods = methodsFor(model);
    dispatch(changeEntityField({ name: 'brand', value: model.brand }));
    dispatch(changeEntityField({ name: 'model', value: model.name }));
    dispatch(changeEntityField({ name: 'size', value: model.size }));
    const nextMode = nextMethods.includes(commandMode) ? commandMode : nextMethods[0];
    dispatch(changeEntityField({ name: 'commandMode', value: nextMode }));
    dispatch(changeEntityField({ name: 'colorPrinter', value: model.twoColor && model.impact && nextMode !== 'WINDOWS_DRIVER' }));
    const kitchen = printerEntity.kitchenComponents?.length ? printerEntity.kitchenComponents : defaultKitchenLayout(nextMode);
    dispatch(changeEntityField({ name: 'kitchenComponents', value: applyKitchenFontDefaults(kitchen, nextMode) }));
  };

  const handleMethodChange = (value: PrinterCommandMode) => {
    dispatch(changeEntityField({ name: 'commandMode', value }));
    if (value === 'WINDOWS_DRIVER') dispatch(changeEntityField({ name: 'colorPrinter', value: false }));
    const kitchen = printerEntity.kitchenComponents?.length ? printerEntity.kitchenComponents : defaultKitchenLayout(value);
    dispatch(changeEntityField({ name: 'kitchenComponents', value: applyKitchenFontDefaults(kitchen, value) }));
  };

  const copyMasterTemplate = () => {
    const supportsRed = commandMode !== 'WINDOWS_DRIVER' && !!selectedModel?.twoColor;
    axios.get('api/settings/kitchen-print-template').then(response => {
      const stored = response.data?.components;
      const source = Array.isArray(stored) && stored.length > 0 ? stored : defaultKitchenLayout(commandMode);
      dispatch(changeEntityField({
        name: 'kitchenComponents',
        value: fitKitchenLayoutToPrinter(source, paperColumns, supportsRed, commandMode),
      }));
    });
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
      dispatch(changeEntityField({ name: 'kitchenComponents', value: defaultKitchenLayout() }));
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
            <Label htmlFor="printer-brand-select" className="text-sm">{translate('tempApp.printer.brand')}</Label>
            <ShadcnSelect value={selectedBrand || undefined} onValueChange={handleBrandChange}>
              <SelectTrigger id="printer-brand-select" className="h-7 text-xs min-w-[200px]">
                <SelectValue placeholder={translate('tempApp.printer.brand')} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {PRINTER_BRANDS.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-modelId" className="text-sm">{translate('tempApp.printer.printerModel')}</Label>
            <ShadcnSelect value={printerEntity?.modelId || NO_MODEL} onValueChange={handleModelChange} disabled={brandModels.length === 0}>
              <SelectTrigger id="printer-modelId" className="h-7 text-xs min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value={NO_MODEL}>{translate('tempApp.printer.printerModelNone')}</SelectItem>
                {brandModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.fontAColumns}/{model.fontBColumns}{model.twoColor ? ', red' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-commandMode" className="text-sm">{translate('tempApp.printer.commandMode')}</Label>
            <ShadcnSelect value={commandMode} onValueChange={(value) => handleMethodChange(value as PrinterCommandMode)}>
              <SelectTrigger id="printer-commandMode" className="h-7 text-xs min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map(mode => (
                  <SelectItem key={mode} value={mode}>
                    {mode === 'STAR_LINE'
                      ? translate('tempApp.printer.commandModeStarLine')
                      : mode === 'WINDOWS_DRIVER'
                        ? translate('tempApp.printer.commandModeWindows')
                        : translate('tempApp.printer.commandModeEscPos')}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Paper</Label>
            <p className="text-xs text-muted-foreground">
              {paperSize}{paperColumns ? `. Characters per line is ${paperColumns}` : '. Windows driver uses the printer paper settings'}
            </p>
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
                  onChange={e => dispatch(changeEntityField({ name: 'port', value: parseInt(e.target.value) ?? 0 }))}
                  required
                  className="h-7 text-xs"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="printer-serviceName" className="text-sm">Printer Windows Driver</Label>
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
              onChange={e => dispatch(changeEntityField({ name: 'printSpeed', value: parseInt(e.target.value) ?? 0 }))}
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
            />
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

          <div className="flex justify-end">
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={copyMasterTemplate}>
              Copy master kitchen template
            </Button>
          </div>
          <KitchenLayoutEditor
            key={commandMode}
            components={printerEntity.kitchenComponents?.length ? printerEntity.kitchenComponents : defaultKitchenLayout(commandMode)}
            supportsRed={commandMode !== 'WINDOWS_DRIVER'}
            commandMode={commandMode}
            model={selectedModel}
            paperSize={paperSize}
            onChange={value => dispatch(changeEntityField({ name: 'kitchenComponents', value }))}
          />

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
