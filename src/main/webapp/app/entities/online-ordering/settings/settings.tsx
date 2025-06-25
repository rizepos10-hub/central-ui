import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { Translate, translate, ValidatedField } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, reset, changeEntityField } from './settings.reducer';
import { InputNumber } from "primereact/inputnumber";
import {
  currencySymbolPositionOptions,
  IFontSetting,
  ISocialProfiles,
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
import { ISocialProfile } from 'app/shared/model/ONLINE_ORDERING/social-profile';
import { Dropdown } from 'primereact/dropdown';

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

  const handleCustomThemeSelector = (theme) => {
    const newData = JSON.parse(JSON.stringify(UiSettingsEntity?.colorSetting)) || {};
    Object.keys(theme).forEach(key => {
      newData[key] = theme[key];
    });
    dispatch(changeEntityField({ name: 'colorSetting', value: newData }));
  };

  return (
    <div>
      <Row>
        <Col>
          <h2>Edit UI Settings</h2>
        </Col>
      </Row>
      <Row>
        <Col className="d-flex flex-column p-3  bg-white">
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
                      <Label htmlFor="UiSettings-address">
                        <strong>{translate('tempApp.UiSettings.address')}</strong>
                      </Label>
                      <InputText
                        id="UiSettings-address"
                        value={UiSettingsEntity.address || null}
                        onChange={e => dispatch(changeEntityField({ name: 'address', value: e.target.value }))}
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
                  <TabPanel header="Social Profiles">
                    <SocialProfiles socialProfiles={UiSettingsEntity.socialProfiles} />
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
                      <Label htmlFor="UiSettings-canOrder">
                        <strong>{translate('tempApp.UiSettings.canOrder')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-canOrder"
                        checked={UiSettingsEntity.canOrder || null}
                        onChange={e => dispatch(changeEntityField({ name: 'canOrder', value: e.checked }))}
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-canOrderOutOfStock">
                        <strong>{translate('tempApp.UiSettings.canOrderOutOfStock')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-canOrderOutOfStock"
                        checked={UiSettingsEntity.canOrderOutOfStock || null}
                        onChange={e => dispatch(changeEntityField({ name: 'canOrderOutOfStock', value: e.checked }))}
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
                    {/* <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-itemPerRow">
                        <strong>{translate('tempApp.UiSettings.itemPerRow')}</strong>
                      </Label>
                      <InputNumber
                        id="UiSettings-itemPerRow"
                        value={UiSettingsEntity.itemPerRow || null}
                        onChange={e => dispatch(changeEntityField({ name: 'itemPerRow', value: e.value }))}
                      />
                    </div> */}

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
                      <Label htmlFor="UiSettings-hideBranchesSection">
                        <strong>{translate('tempApp.UiSettings.hideBranchesSection')}</strong>
                      </Label>
                      <Checkbox
                        id="UiSettings-hideBranchesSection"
                        checked={UiSettingsEntity.hideBranchesSection || null}
                        onChange={e => dispatch(changeEntityField({ name: 'hideBranchesSection', value: e.checked }))}
                      />
                    </div>

                    <div className="d-flex flex-column mb-3">
                      <Label htmlFor="UiSettings-retailItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.retailItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-retailItemsPerRow"
                        value={UiSettingsEntity.retailItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'retailItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className="d-flex flex-column mb-3">
                      <Label htmlFor="UiSettings-restaurantItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.restaurantItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-restaurantItemsPerRow"
                        value={UiSettingsEntity.restaurantItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-retailItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.retailItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-retailItemsPerRow"
                        value={UiSettingsEntity.retailItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'retailItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className="d-flex flex-column mb-3">
                      <Label htmlFor="UiSettings-restaurantItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.restaurantItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-restaurantItemsPerRow"
                        value={UiSettingsEntity.restaurantItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-retailItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.retailItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-retailItemsPerRow"
                        value={UiSettingsEntity.retailItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'retailItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className="d-flex flex-column mb-3">
                      <Label htmlFor="UiSettings-restaurantItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.restaurantItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-restaurantItemsPerRow"
                        value={UiSettingsEntity.restaurantItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <Label htmlFor="UiSettings-retailItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.retailItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-retailItemsPerRow"
                        value={UiSettingsEntity.retailItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'retailItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className="d-flex flex-column mb-3">
                      <Label htmlFor="UiSettings-restaurantItemsPerRow">
                        <strong>{translate('tempApp.UiSettings.restaurantItemsPerRow')}</strong>
                      </Label>
                      <Dropdown
                        id="UiSettings-restaurantItemsPerRow"
                        value={UiSettingsEntity.restaurantItemsPerRow || null}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                          { label: '4', value: 4 }
                        ]}
                        onChange={(e) =>
                          dispatch(changeEntityField({ name: 'restaurantItemsPerRow', value: e.value }))
                        }
                        placeholder="Select an option"
                      />
                    </div>

                    <div className={'d-flex flex-column mb-3'}>
                      <h2>
                        <strong>{translate('tempApp.UiSettings.colorSetting.title')}</strong>
                      </h2>
                      <PremadeColorThemes handleCustomThemeSelector={handleCustomThemeSelector} />
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
                                  ? hslToHex(UiSettingsEntity.colorSetting[key])  // Convert from HSL to HEX for the color picker
                                  : '#000000'
                              }
                              onChange={(e) => handleColorSettingChange(key, e.value, true)}  // Passing HEX value from picker
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

const SocialProfiles = ({
  socialProfiles
}: {
  socialProfiles: ISocialProfiles | null
}) => {
  const dispatch = useAppDispatch();
  const handleChange = (field: keyof ISocialProfiles, value: string) => {
    // Handle null case by defaulting to an empty object
    const currentSocialProfiles = socialProfiles || {};
    const currentField = currentSocialProfiles[field] || {};
    const newSocialProfilesValues = {
      ...currentSocialProfiles,
      [field]: {
        ...currentField,
        url: value,
        name: field
      }
    };
    dispatch(changeEntityField({ name: "socialProfiles", value: newSocialProfilesValues }));
  };

  const socials = [
    { key: 'INSTAGRAM', label: 'Instagram' },
    { key: 'FACEBOOK', label: 'Facebook' },
    { key: 'TIKTOK', label: 'Tiktok' },
    { key: 'TWITTER', label: 'Twitter' },
    { key: 'YOUTUBE', label: 'Youtube' },
    { key: 'LINKEDIN', label: 'Linkedin' }
  ];

  return (
    <>
      {socials.map((social, idx) => (
        <FormGroup key={idx}>
          <Label for={social.key}>
            {translate(`tempApp.layoutSettings.tabs.contactInfo.socials.${social.key}`)}
          </Label>
          <Input
            type='text'
            id={social.key}
            name={social.key}
            placeholder={`${social.label} URL`}
            // Safely access url even if socialProfiles or the specific profile is null
            value={socialProfiles?.[social.key]?.url || ''}
            onChange={(e) => handleChange(social.key as keyof ISocialProfiles, e.target.value)}
          />
        </FormGroup>
      ))}
    </>
  );
};

const PremadeColorThemes = ({
  handleCustomThemeSelector
}) => {
  return (
    <div className='d-flex flex-column gap-2 py-2'>
      <h6 className='border-bottom-1'>Pre-made Themes</h6>
      <div className='d-flex gap-2 pb-2'>
        <div className='d-flex gap-2 flex-column'>
          Light Crimson
          <div onClick={() => {
            handleCustomThemeSelector({
              "background": '0 0% 100%',
              "foreground": '20 14.3% 4.1%',
              "primary": '24 9.8% 10%',
              "primary-foreground": '60 9.1% 97.8%',
              "secondary": '60 4.8% 95.9%',
              "secondary-foreground": '24 9.8% 10%',
              "muted": '60 4.8% 95.9%',
              "muted-foreground": '25 5.3% 44.7%',
              "custom-color": '0, 75%, 59%',
            })
          }}
            style={{
              height: '3rem',
              width: '6rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              backgroundColor: 'hsl(0 0% 100%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(60 4.8% 95.9%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(0, 75%, 59%)',
              width: '100%',
              height: '100%',
            }}></div>
          </div>
        </div>
        <div className='d-flex gap-2 flex-column'>
          Dark Crimson
          <div onClick={() => {
            handleCustomThemeSelector({
              "background": '24 10% 10%',
              "foreground": '60 9.1% 97.8%',
              "primary": '60 9.1% 97.8%',
              "primary-foreground": '24 9.8% 10%',
              "secondary": '12 6.5% 15.1%',
              "secondary-foreground": '60 9.1% 97.8%',
              "muted": '12 6.5% 15.1%',
              "muted-foreground": '24 5.4% 63.9%',
              "custom-color": '0, 75%, 59%',
            })
          }}
            style={{
              height: '3rem',
              width: '6rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              backgroundColor: 'hsl(24 10% 10%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(12 6.5% 15.1%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(0, 75%, 59%)',
              width: '100%',
              height: '100%',
            }}></div>
          </div>
        </div>
        <div className='d-flex gap-2 flex-column'>
          Modern Ledger
          <div onClick={() => {
            handleCustomThemeSelector({
              "background": '350 42% 98%',
              "foreground": '350 80% 3%',
              "primary": '350 40% 41%',
              "primary-foreground": '0 0% 100%',
              "secondary": '350 10% 84%',
              "secondary-foreground": '350 10% 24%',
              "muted": '350 33% 91%',
              "muted-foreground": '350 13% 36%',
              "custom-color": '349.8 39.25925925925926 26.47058823529412%',
            })
          }}
            style={{
              height: '3rem',
              width: '6rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              backgroundColor: 'hsl(350 42% 98%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(350 40% 41%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(350 10% 84%)',
              width: '100%',
              height: '100%',
            }}></div>
          </div>
        </div>
        <div className='d-flex gap-2 flex-column'>
          Autumn Harvest
          <div onClick={() => {
            handleCustomThemeSelector({
              "background": '222 39% 98%',
              "foreground": '222 71% 4%',
              "primary": '222 69% 44%',
              "primary-foreground": '0 0% 100%',
              "secondary": '42 69% 44%',
              "secondary-foreground": '42 69% 4%',
              "muted": '42 24% 88%',
              "muted-foreground": '42 4% 25%',
              "custom-color": '349.8 39.25925925925926 26.47058823529412%',
            })
          }}
            style={{
              height: '3rem',
              width: '6rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              backgroundColor: 'hsl(222 39% 98%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(222 69% 44%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(42 69% 44%)',
              width: '100%',
              height: '100%',
            }}></div>
          </div>
        </div>
        <div className='d-flex gap-2 flex-column'>
          Mint
          <div onClick={() => {
            handleCustomThemeSelector({
              "background": '186 63% 99%',
              "foreground": '186 62% 5%',
              "primary": '186 62% 66%',
              "primary-foreground": '186 62% 5%',
              "secondary": '186 2% 87%',
              "secondary-foreground": '186 2% 27%',
              "muted": '186 39% 89%',
              "muted-foreground": '186 5% 27%',
              "custom-color": '185.7 34.25925925925925 42.35294117647059%',
            })
          }}
            style={{
              height: '3rem',
              width: '6rem',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              backgroundColor: 'hsl(186 63% 99%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(186 62% 66%)',
              width: '100%',
              height: '100%',
            }}></div>
            <div style={{
              backgroundColor: 'hsl(186 2% 87%)',
              width: '100%',
              height: '100%',
            }}></div>
          </div>
        </div>
        {/* <div className='d-flex gap-2 flex-column'>
        Mint
        <div onClick={() => {
          handleCustomThemeSelector({
            "background": '220 23% 5%',
            "foreground": '210 25% 95%',
            "primary": '346.42 78.12% 44.05%',
            "primary-foreground": '210 0% 100%',
            "secondary": '210 15% 25%',
            "secondary-foreground": '210 15% 85%',
            "muted": '220 12% 15%',
            "muted-foreground": '220 12% 65%',
            "custom-color": '185.7 34.25925925925925 42.35294117647059%',
          })
        }}
          style={{
            height: '3rem',
            width: '6rem',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            backgroundColor: 'hsl(220 23% 5%)',
            width: '100%',
            height: '100%',
          }}></div>
          <div style={{
            backgroundColor: 'hsl(346.42 78.12% 44.05%)',
            width: '100%',
            height: '100%',
          }}></div>
          <div style={{
            backgroundColor: 'hsl(210 15% 25%)',
            width: '100%',
            height: '100%',
          }}></div>
        </div>
      </div> */}
        {/* <div className='d-flex gap-2 flex-column'>
        Mint
        <div onClick={() => {
          handleCustomThemeSelector({
            "background": '69 62% 98%',
            "foreground": '69 63% 4%',
            "primary": '69 60% 12%',
            "primary-foreground": '69 60% 52%',
            "secondary": '39 60% 12%',
            "secondary-foreground": '39 60% 52%',
            "muted": '39 11% 92%',
            "muted-foreground": '39 9% 39%',
            "custom-color": '70.0 39.99999999999999 29.411764705882355%',
          })
        }}
          style={{
            height: '3rem',
            width: '6rem',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            backgroundColor: 'hsl(69 62% 98%)',
            width: '100%',
            height: '100%',
          }}></div>
          <div style={{
            backgroundColor: 'hsl(69 60% 12%)',
            width: '100%',
            height: '100%',
          }}></div>
          <div style={{
            backgroundColor: 'hsl(39 60% 12%)',
            width: '100%',
            height: '100%',
          }}></div>
        </div>
      </div> */}
      </div>
    </div>
  )
}

export default UiSettingsUpdate;
