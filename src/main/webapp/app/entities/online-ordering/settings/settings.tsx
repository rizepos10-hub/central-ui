import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, reset, changeEntityField } from './settings.reducer';
import { InputNumber } from "primereact/inputnumber";
import {
  currencySymbolPositionOptions,
  IFontSetting,
  IUiSettings,
  orderTakingOptions
} from "app/shared/model/ONLINE_ORDERING/ui-setting.model";
import { SelectButton } from "primereact/selectbutton";
import { Checkbox } from "primereact/checkbox";
import Attachment from "app/shared/components/attachment/attachment";
import { InputText } from 'primereact/inputtext';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Editor } from 'primereact/editor';
import { TabPanel, TabView } from 'primereact/tabview';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { ColorPicker } from 'primereact/colorpicker';
import { hexToHSL, hslToHex } from 'app/shared/util/color-utils';

export const UiSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const loading = useAppSelector(state => state.uiSettings.loading);
  const updating = useAppSelector(state => state.uiSettings.updating);
  const updateSuccess = useAppSelector(state => state.uiSettings.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);

  const [fontSettings, setFontSettings] = useState<IFontSetting>({
    fontFamily: '',
    fontSize: '',
    fontWeight: '',
    lineHeight: '',
    letterSpacing: ''
  });


  useEffect(() => {
    dispatch(getEntity());
    dispatch(getBranches({}));
  }, []);

  const saveEntity = (e) => {
    e.preventDefault();
    dispatch(updateEntity(UiSettingsEntity));
  };

  const quillHeader = (
    <span className="ql-formats">
      <select className="ql-size">
        <option value="small"></option>
        <option selected></option>
        <option value="large"></option>
        <option value="huge"></option>
      </select>
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <select className="ql-color"></select>
      <button className="ql-align" value=""></button>
      <button className="ql-align" value="center"></button>
      <button className="ql-align" value="right"></button>
      <button className="ql-list" value="bullet"></button>
    </span>
  );

  const handleBranchHideRetailShop = (branchIndex, checked, branchId) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.branchDetail));
    newData[branchIndex] = {
      ...newData[branchIndex],
      hideRetailShop: checked,
      branchId,
    };
    console.log(branchIndex)
    console.log(newData)
    dispatch(changeEntityField({ name: 'branchDetail', value: newData }));
  };

  const handleColorSettingChange = (field, value, isHex = false) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.colorSetting)) || {};
    newData[field] = isHex ? hexToHSL(value) : value; // Convert to HSL if HEX is provided, else use the value directly
    dispatch(changeEntityField({ name: 'colorSetting', value: newData }));
  };

  const handlefontSettingChange = (field, value) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.fontSetting)) || {};
    newData[field] = value;
    dispatch(changeEntityField({ name: 'fontSetting', value: newData }));
  };


  console.log(UiSettingsEntity, 'UiSettingsEntity')

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>Edit UI Settings</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <TabView>
                  <TabPanel header="General">
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-applicationName">
                        <strong>{translate('tempApp.UiSettings.applicationName')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-applicationName"
                        value={UiSettingsEntity.applicationName || null}
                        onChange={e => dispatch(changeEntityField({ name: 'applicationName', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-domain">
                        <strong>{translate('tempApp.UiSettings.domain')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-domain"
                        value={UiSettingsEntity.domain || null}
                        onChange={e => dispatch(changeEntityField({ name: 'domain', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-email">
                        <strong>{translate('tempApp.UiSettings.email')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-email"
                        value={UiSettingsEntity.email || null}
                        onChange={e => dispatch(changeEntityField({ name: 'email', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-phoneNumber">
                        <strong>{translate('tempApp.UiSettings.phoneNumber')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-phoneNumber"
                        value={UiSettingsEntity.phoneNumber || null}
                        onChange={e => dispatch(changeEntityField({ name: 'phoneNumber', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-cookie">
                        <strong>{translate('tempApp.UiSettings.cookie')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-cookie"
                        value={UiSettingsEntity.cookie || null}
                        onChange={e => dispatch(changeEntityField({ name: 'cookie', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-privacyPolicy">
                        <strong>{translate('tempApp.UiSettings.privacyPolicy')}</strong>
                      </Label>
                      <Editor
                        value={UiSettingsEntity.privacyPolicy || null}
                        onTextChange={e => dispatch(changeEntityField({ name: 'privacyPolicy', value: e.htmlValue }))}
                        style={{
                          minHeight: '400px',
                        }}
                        headerTemplate={quillHeader}
                      />
                    </div>
                  </TabPanel>
                  <TabPanel header="Order">
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-orderTaking">
                        <strong>{translate('tempApp.UiSettings.orderTaking')}</strong>
                      </Label>
                      <SelectButton
                        options={orderTakingOptions}
                        id="UiSettings-orderTaking"
                        value={UiSettingsEntity.orderTaking || null}
                        onChange={e => dispatch(changeEntityField({ name: 'orderTaking', value: e.target.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-orderConfirmation">
                        <strong>{translate('tempApp.UiSettings.orderConfirmation')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-orderConfirmation"
                        checked={UiSettingsEntity.orderConfirmation || null}
                        onChange={e => dispatch(changeEntityField({ name: 'orderConfirmation', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-scheduleOrders">
                        <strong>{translate('tempApp.UiSettings.scheduleOrders')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-scheduleOrders"
                        checked={UiSettingsEntity.scheduleOrders || null}
                        onChange={e => dispatch(changeEntityField({ name: 'scheduleOrders', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <TabView className='w-100' scrollable>
                        {branchList?.map((branch, index) => (
                          <TabPanel header={branch.name} key={index}>
                            <div className="d-flex mb-3">
                              <label className="font-bold">Hide Retail Shop</label>
                              <Checkbox
                                checked={UiSettingsEntity?.branchDetail?.[index]?.hideRetailShop || false}
                                onChange={(e) => handleBranchHideRetailShop(index, e.checked, branch.id)}
                              />
                            </div>
                          </TabPanel>
                        ))}
                      </TabView>
                    </div>
                  </TabPanel>
                  <TabPanel header="UI/UX">
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-itemPerRow">
                        <strong>{translate('tempApp.UiSettings.itemPerRow')}</strong>
                      </Label>
                      <InputNumber
                        id="UiSettings-itemPerRow"
                        value={UiSettingsEntity.itemPerRow || null}
                        onChange={e => dispatch(changeEntityField({ name: 'itemPerRow', value: e.value }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-logo">
                        <strong>{translate('tempApp.UiSettings.logo')}</strong>
                      </Label>
                      <MediaLibrary
                        handleFilesSelectCallback={files =>
                          dispatch(
                            changeEntityField({
                              name: 'logo',
                              value: transformAttachmentStructure(files, 'toIAttachment')[0],
                            })
                          )
                        }
                        defaultValues={transformAttachmentStructure(
                          UiSettingsEntity.logo ? [UiSettingsEntity.logo] : [],
                          'toFileLibraryListItem'
                        )}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <h2>
                        <strong>{translate('tempApp.UiSettings.colorSetting.title')}</strong>
                      </h2>
                      {UiSettingsEntity?.colorSetting && (
                        Object.keys(UiSettingsEntity.colorSetting).map(key => (
                          <div className="d-flex gap-2" key={key}>
                            <Label htmlFor={`UiSettings-colorSetting.${key}`}>
                              <strong>{translate(`tempApp.UiSettings.colorSetting.${key}`)}</strong>
                            </Label>
                            <InputText
                              id={`UiSettings-colorSetting.${key}`}
                              value={UiSettingsEntity.colorSetting[key] || ''}
                              onChange={(e) => handleColorSettingChange(key, e.target.value)}
                            />

                            <ColorPicker
                              value={
                                UiSettingsEntity && typeof UiSettingsEntity.colorSetting[key] === 'string'
                                  ? hslToHex(UiSettingsEntity.colorSetting[key])
                                  : '#000000'
                              }
                              onChange={(e) => handleColorSettingChange(key, e.value, true)}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <h2>
                        <strong>{translate('tempApp.UiSettings.fontSetting.title')}</strong>
                      </h2>
                      {Object.keys(fontSettings).map(key => (
                        <div className="d-flex gap-2" key={key}>
                          <Label htmlFor={`UiSettings-fontSetting.${key}`}>
                            <strong>{translate(`tempApp.UiSettings.fontSetting.${key}`)}</strong>
                          </Label>
                          <InputText
                            id={`UiSettings-fontSetting.${key}`}
                            value={UiSettingsEntity?.fontSetting?.[key] || ''}
                            onChange={(e) => handlefontSettingChange(key, e.target.value)}
                          />
                        </div>
                      ))}

                    </div>
                  </TabPanel>
                  <TabPanel header="Visibility & Formatting">
                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-hideItemDescription">
                        <strong>{translate('tempApp.UiSettings.hideItemDescription')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-hideItemDescription"
                        checked={UiSettingsEntity.hideItemDescription || null}
                        onChange={e => dispatch(changeEntityField({ name: 'hideItemDescription', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-hideModalDescription">
                        <strong>{translate('tempApp.UiSettings.hideModalDescription')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-hideModalDescription"
                        checked={UiSettingsEntity.hideModalDescription || null}
                        onChange={e => dispatch(changeEntityField({ name: 'hideModalDescription', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-showDeliveryTips">
                        <strong>{translate('tempApp.UiSettings.showDeliveryTips')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-showDeliveryTips"
                        checked={UiSettingsEntity.showDeliveryTips || null}
                        onChange={e => dispatch(changeEntityField({ name: 'showDeliveryTips', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-currencySymbolPosition">
                        <strong>{translate('tempApp.UiSettings.currencySymbolPosition')}</strong>
                      </Label>
                      <SelectButton
                        options={currencySymbolPositionOptions}
                        id="UiSettings-currencySymbolPosition"
                        value={UiSettingsEntity.currencySymbolPosition || null}
                        onChange={e =>
                          dispatch(
                            changeEntityField({
                              name: 'currencySymbolPosition',
                              value: e.target.value,
                            })
                          )
                        }
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-digitsAfterDecimal">
                        <strong>{translate('tempApp.UiSettings.digitsAfterDecimal')}</strong>
                      </Label>
                      <InputNumber
                        id="UiSettings-digitsAfterDecimal"
                        value={UiSettingsEntity.digitsAfterDecimal || null}
                        onChange={e => dispatch(changeEntityField({ name: 'digitsAfterDecimal', value: e.value }))}
                      />
                    </div>
                  </TabPanel>
                </TabView>
              </FormGroup>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/online-ordering/settings" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UiSettingsUpdate;
