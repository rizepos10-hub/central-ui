import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, reset } from './floor-plan-settings.reducer';
import {InputText} from "primereact/inputtext";
import {IFloorPlanSettings} from "app/shared/model/FLOOR-PLAN/floor-plan-settings.model";
import {InputNumber} from "primereact/inputnumber";
import {Translate} from "react-jhipster";
import Attachment from "app/shared/layout/attachment/attachment";

export const FloorPlanSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [floorPlanSettings, setFloorPlanSettings] = useState<IFloorPlanSettings>({
    sectionDimensions: null,
    tableDimensions: null,
    tableImage: null,
    sectionBackground: null
  });

  const floorPlanSettingsEntity = useAppSelector(state => state.floorPlanSettings.entity);
  const loading = useAppSelector(state => state.floorPlanSettings.loading);
  const updating = useAppSelector(state => state.floorPlanSettings.updating);
  const updateSuccess = useAppSelector(state => state.floorPlanSettings.updateSuccess);



  useEffect(() => {
    dispatch(getEntity());
    return () => {
      dispatch(reset())
    }
  }, []);

  useEffect(() => {
    if(floorPlanSettingsEntity){
      setFloorPlanSettings(floorPlanSettingsEntity)
    }
  }, [updateSuccess,loading]);

  const handleChange = (e,name) => {
    const value = e.value
    const [property, subProperty] = name.split('-');

    console.log('Property:', property);
    console.log('Subproperty:', subProperty);

    setFloorPlanSettings((prevState) => {
      const newState = { ...prevState };
      if (subProperty) {
        newState[property] = {
          ...newState[property],
          [subProperty]: value,
        };
      }
      return newState;
    });
  };




  const removeImage = (type) => {
    setFloorPlanSettings(prev => ({
      ...prev,
      [type]: null
    }))
  }


  const addTableImage = (imageInfo) => {
    setFloorPlanSettings(prev => ({
      ...prev,
      tableImage: imageInfo
    }))
  }
  const addSectionBackgroundImage = (imageInfo) => {
    setFloorPlanSettings(prev => ({
      ...prev,
      sectionBackground: imageInfo
    }))
  }


  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...floorPlanSettings,
    };
    console.log(floorPlanSettings, 'floorPlanSettings')
    dispatch(updateEntity(entity));
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>Edit Floor Plan Settings</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 bg-white">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <FormGroup>
                <div className="d-flex flex-column">
                  <h5>Section Dimensions</h5>
                  <div className={"d-flex gap-3 mb-2"}>
                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                          width
                   </span>
                    <InputNumber
                      size={1}
                      maxFractionDigits={2}
                      name="sectionDimensions-width"
                      required={true}
                      value={floorPlanSettings?.sectionDimensions?.width || 0}
                      onChange={ (e) => handleChange(e,"sectionDimensions-width")}

                    />
                      <span className="p-inputgroup-addon">px</span>
                    </div>
                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                        height
                      </span>
                    <InputNumber
                      size={1}
                      maxFractionDigits={2}
                      name="sectionDimensions-height"
                      required={true}
                      value={floorPlanSettings?.sectionDimensions?.height || 0}
                      onChange={ (e) => handleChange(e,"sectionDimensions-height")}
                    />
                      <span className="p-inputgroup-addon">px</span>
                  </div>
                  </div>
                </div>

                <div className="d-flex flex-column mt-3">
                  <h5>Table Dimensions</h5>
                  <div className={"d-flex gap-3 mb-2"}>
                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                          width
                   </span>
                      <InputNumber
                        size={1}
                        maxFractionDigits={2}
                        name="tableDimensions-width"
                        required={true}
                        value={floorPlanSettings?.tableDimensions?.width || 0}
                        onChange={ (e) => handleChange(e,"tableDimensions-width")}

                      />
                      <span className="p-inputgroup-addon">px</span>
                    </div>
                    <div className="p-inputgroup w-full md:w-10rem">
                      <span className="p-inputgroup-addon">
                        height
                      </span>
                      <InputNumber
                        size={1}
                        maxFractionDigits={2}
                        name="tableDimensions-height"
                        required={true}
                        value={floorPlanSettings?.tableDimensions?.height || 0}
                        onChange={ (e) => handleChange(e,"tableDimensions-height")}

                      />
                      <span className="p-inputgroup-addon">px</span>
                    </div>
                  </div>
                </div>
                <div className={"d-flex flex-column"}>
                  <label  className={"mt-2"}>
                    <Translate contentKey={"tempApp.floorPlanSettings.tableImage"}>Table Image</Translate>
                  </label>
                  <Attachment
                    image={floorPlanSettings.tableImage}
                    onRemoveImage={() => removeImage("tableImage")}
                    onAddImage={addTableImage}
                  />
                </div>

                <div className={"d-flex flex-column"}>
                  <label  className={"mt-2"}>
                    <Translate contentKey={"tempApp.floorPlanSettings.sectionBackground"}>Section Background Image</Translate>
                  </label>
                  <Attachment
                    image={floorPlanSettings.sectionBackground}
                    onRemoveImage={() => removeImage("sectionBackground")}
                    onAddImage={addSectionBackgroundImage}
                  />
                </div>
              </FormGroup>
              <Button tag={Link} to="/pizza-size" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;Back
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;Save
              </Button>
            </form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default FloorPlanSettingsUpdate;
