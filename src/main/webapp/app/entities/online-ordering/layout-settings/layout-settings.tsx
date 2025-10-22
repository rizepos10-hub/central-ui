import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, Card } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IUiSettings } from "app/shared/model/ONLINE_ORDERING/ui-setting.model";
import { TabPanel, TabView } from 'primereact/tabview';
import Slider from './components/slider';
import SocialProfiles from './components/social-profiles';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { RestaurantCategories } from './components/restaurant-categories';
import { RetailCategories } from './components/retail-categories';
import ProductSetting from './components/product-setting';
import { getEntity, updateEntity } from '../settings/settings.reducer';


const LayoutSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  const uiSettings: IUiSettings = useAppSelector(state => state.uiSettings.entity);
  const UiLayoutSettingsEntity: ILayoutSettings = uiSettings.homePageSetting;
  const loading = useAppSelector(state => state.uiSettings.loading);
  const updating = useAppSelector(state => state.uiSettings.updating);
  const updateSuccess = useAppSelector(state => state.uiSettings.updateSuccess);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }

    dispatch(getEntity());
  }, [updateSuccess]);

  const handleClose = () => {
    navigate(-1);
  };

  const saveEntity = (e) => {
    e.preventDefault();
    const entity = {
      ...uiSettings,
      homePageSetting: UiLayoutSettingsEntity
    };

    dispatch(updateEntity(entity));
  };


  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            Edit {translate('tempApp.layoutSettings.home.title')}
          </h2>
        </Col>
      </Row>
      <Col md={9}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form >
            <Card>
              <TabView>
                <TabPanel header={translate('tempApp.layoutSettings.tabs.contactInfo.label')}>
                  <SocialProfiles socialProfiles={UiLayoutSettingsEntity.socialProfiles} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.slider.label')}>
                  <Slider sliderSettings={UiLayoutSettingsEntity.sliderSettings} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.specialProducts.label')}>
                  <ProductSetting productSetting={UiLayoutSettingsEntity.productSetting} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.restaurantCategories.label')}>
                  <RestaurantCategories restuarantCategorySetting={UiLayoutSettingsEntity.restuarantCategorySetting} />
                </TabPanel>

                <TabPanel header={translate('tempApp.layoutSettings.tabs.retailCategories.label')}>
                  <RetailCategories retailCategorySetting={UiLayoutSettingsEntity.retailCategorySetting} />
                </TabPanel>
              </TabView>
            </Card >

            <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/online-ordering/settings" replace color="info">
              <FontAwesomeIcon icon="arrow-left" />
              &nbsp;
              <span className="d-none d-md-inline">
                <Translate contentKey="entity.action.back">Back</Translate>
              </span>
            </Button>
            <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
              <FontAwesomeIcon icon="save" />
              &nbsp;
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </form >
        )}
      </Col >
    </div >
  );
};

export default LayoutSettingsUpdate;
