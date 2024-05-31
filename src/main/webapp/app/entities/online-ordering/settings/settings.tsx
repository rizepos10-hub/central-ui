import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label} from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import {getEntity, updateEntity, reset, changeEntityField} from './settings.reducer';
import {InputNumber} from "primereact/inputnumber";
import {
  currencySymbolPositionOptions,
  IUiSettings,
  orderTakingOptions
} from "app/shared/model/ONLINE_ORDERING/ui-setting.model";
import {SelectButton} from "primereact/selectbutton";
import {Checkbox} from "primereact/checkbox";
import Attachment from "app/shared/components/attachment/attachment";
import { InputText } from 'primereact/inputtext';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

export const UiSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const UiSettingsEntity: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const loading = useAppSelector(state => state.uiSettings.loading);
  const updating = useAppSelector(state => state.uiSettings.updating);
  const updateSuccess = useAppSelector(state => state.uiSettings.updateSuccess);


  useEffect(() => {
    dispatch(getEntity());
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }

  }, [updateSuccess]);



  const handleClose = () => {
    navigate('/online-ordering/settings' + location.search);
  };

  const saveEntity = (e) => {
    e.preventDefault();
    dispatch(updateEntity(UiSettingsEntity));
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            Edit UI Settings
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8"  className="d-flex flex-column p-3  bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-currencySymbolPosition">
                    <strong>
                    {translate('tempApp.UiSettings.currencySymbolPosition')}
                    </strong>
                  </Label>
                  <SelectButton
                    options={currencySymbolPositionOptions}
                    id="UiSettings-currencySymbolPosition"
                    value={UiSettingsEntity.currencySymbolPosition || null}
                    onChange={e => dispatch(changeEntityField({name: 'currencySymbolPosition',value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-orderTaking">
                    <strong>
                    {translate('tempApp.UiSettings.orderTaking')}
                    </strong>
                  </Label>
                  <SelectButton
                    options={orderTakingOptions}
                    id="UiSettings-orderTaking"
                    value={UiSettingsEntity.orderTaking || null}
                    onChange={e => dispatch(changeEntityField({name: 'orderTaking',value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-domain">
                    <strong>
                    {translate('tempApp.UiSettings.domain')}
                    </strong>
                  </Label>
                  <InputText
                    id="UiSettings-domain"
                    value={UiSettingsEntity.domain || null}
                    onChange={e => dispatch(changeEntityField({name: 'domain',value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-digitsAfterDecimal">
                    <strong>
                    {translate('tempApp.UiSettings.digitsAfterDecimal')}
                    </strong>
                  </Label>
                  <InputNumber
                    id="UiSettings-digitsAfterDecimal"
                    value={UiSettingsEntity.digitsAfterDecimal || null}
                    onChange={e => dispatch(changeEntityField({name: 'digitsAfterDecimal',value: e.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-itemPerRow">
                    <strong>
                    {translate('tempApp.UiSettings.itemPerRow')}
                    </strong>
                  </Label>
                  <InputNumber
                    id="UiSettings-itemPerRow"
                    value={UiSettingsEntity.itemPerRow || null}
                    onChange={e => dispatch(changeEntityField({name: 'itemPerRow',value: e.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-hideItemDescription">
                    <strong>
                    {translate('tempApp.UiSettings.hideItemDescription')}
                    </strong>
                  </Label>
                  <Checkbox
                    id="UiSettings-hideItemDescription"
                    checked={UiSettingsEntity.hideItemDescription || null}
                    onChange={e => dispatch(changeEntityField({name: 'hideItemDescription',value: e.checked}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-hideModalDescription">
                    <strong>
                    {translate('tempApp.UiSettings.hideModalDescription')}
                    </strong>
                  </Label>
                  <Checkbox
                    id="UiSettings-hideModalDescription"
                    checked={UiSettingsEntity.hideModalDescription || null}
                    onChange={e => dispatch(changeEntityField({name: 'hideModalDescription',value: e.checked}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-scheduleOrders">
                    <strong>
                    {translate('tempApp.UiSettings.scheduleOrders')}
                    </strong>
                  </Label>
                  <Checkbox
                    id="UiSettings-scheduleOrders"
                    checked={UiSettingsEntity.scheduleOrders || null}
                    onChange={e => dispatch(changeEntityField({name: 'scheduleOrders',value: e.checked}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-showDeliveryTips">
                    <strong>
                    {translate('tempApp.UiSettings.showDeliveryTips')}
                    </strong>
                  </Label>
                  <Checkbox
                    id="UiSettings-showDeliveryTips"
                    checked={UiSettingsEntity.showDeliveryTips || null}
                    onChange={e => dispatch(changeEntityField({name: 'showDeliveryTips',value: e.checked}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-logo">
                    <strong>
                      {translate('tempApp.UiSettings.logo')}
                    </strong>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => dispatch(changeEntityField({name: 'logo',value: transformAttachmentStructure(files, 'toIAttachment')[0]}))}
                    defaultValues={transformAttachmentStructure(UiSettingsEntity.logo ? [UiSettingsEntity.logo] : [], 'toFileLibraryListItem')} 
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-email">
                    <strong>
                    {translate('tempApp.UiSettings.email')}
                    </strong>
                  </Label>
                  <InputText
                    id="UiSettings-email"
                    value={UiSettingsEntity.email || null}
                    onChange={e => dispatch(changeEntityField({name: 'email',value: e.target.value}))}
                  />
                </div>

                <div className={"d-flex flex-column mb-3"}>
                  <Label htmlFor="UiSettings-phoneNumber">
                    <strong>
                    {translate('tempApp.UiSettings.phoneNumber')}
                    </strong>
                  </Label>
                  <InputText
                    id="UiSettings-phoneNumber"
                    value={UiSettingsEntity.phoneNumber || null}
                    onChange={e => dispatch(changeEntityField({name: 'phoneNumber',value: e.target.value}))}
                  />
                </div>

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
