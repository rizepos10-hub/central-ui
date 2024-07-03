import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Spinner } from "reactstrap";
import { Card as PrimeCard } from 'primereact/card'
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { updateEntity, createEntity, getEntities, reset } from './business-detail.reducer';
import { uploadImage } from 'app/entities/attachment/attachment.reducer';
import { Button as PrimeButton } from "primereact/button"
import { IBusinessDetail, Metric } from "app/shared/model/business-detail.model";
import _ from 'lodash';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

export const BusinessDetailUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]

  const loading = useAppSelector(state => state.businessDetail.loading);
  const updating = useAppSelector(state => state.businessDetail.updating);
  const updateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);

  const isNew = businessDetailEntity === undefined;

  const [businessDetailsState, setBusinessDetailsState] = useState<IBusinessDetail>({
    businessName: '',
    slogan: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      fullAddress: '',
      longitude: 0,
      latitude: 0,
    },
    branchDetails: []
  });

  const [selectedAttachments, setSelectedAttachments]: any = useState(null)


  const [editingBranchPayments, setEditingBranchPayments] = useState(null);
  const [editPaymentIndex, setEditingPaymentIndex] = useState(null);


  const showDialog = (branch, index) => {
    setEditingBranchPayments(branch.paymentConfigurations)
    setEditingPaymentIndex(index)
  }

  const hideDialog = () => {
    setEditingBranchPayments(null)
  }

  const handleClose = () => {
    navigate('/details' + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntities({}))
    }
    dispatch(getEntities({}))
    if (updateSuccess) {
      handleClose();
    }

  }, [updateSuccess]);

  useEffect(() => {
    if (businessDetailEntity?.logo) {
      setSelectedAttachments(businessDetailEntity?.logo);
    }
    setBusinessDetailsState(businessDetailEntity)
  }, [businessDetailEntity]);



  const saveEntity = values => {

    const entity: IBusinessDetail = {
      ...businessDetailEntity,
      ...values,
      logo: selectedAttachments,
      branchDetails: businessDetailsState?.branchDetails,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  const handleFieldChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name.includes('.')) {
      const [fieldName, subFieldName] = name.split('.');
      setBusinessDetailsState({
        ...businessDetailsState,
        [fieldName]: {
          ...businessDetailsState[fieldName],
          [subFieldName]: value,
        },
      });
    } else {
      setBusinessDetailsState({
        ...businessDetailsState,
        [name]: value,
      });
    }
  };

  if (loading) {
    return <Spinner />
  }

  return (
    <div>
      <Row>
        <Col md="8">
          <h2 id="tempApp.businessDetail.home.createOrEditLabel" data-cy="DetailCreateUpdateHeading">
            {isNew ? 'Create Business Details' : "Edit Business Details"}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 ">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ValidatedForm defaultValues={businessDetailsState} onSubmit={saveEntity}>
                {!isNew ? (
                  <ValidatedField
                    name="id"
                    required
                    readOnly
                    id="details-id"
                    label={translate('global.field.id')}
                    validate={{ required: true }}
                  />
                ) : null}
                <ValidatedField
                  label={'Name'}
                  name="businessName"

                  data-cy="value"
                  type="text"
                  validate={{
                    required: { value: true, message: translate('entity.validation.required') },
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 30 }) },
                  }}
                  onChange={handleFieldChange}
                />
                <ValidatedField
                  label={'Slogan'}
                  id="details-solgan"
                  name="slogan"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}

                />
                <div className='d-flex flex-column gap-2'>
                  <div className='fw-light'>
                    Logo
                  </div>
                  <div className='w-25'>
                    {businessDetailsState && (
                      <MediaLibrary
                        sizePerPage={80}
                        handleFilesSelectCallback={(files) => setSelectedAttachments(transformAttachmentStructure(files, 'toIAttachment')[0])}
                        defaultValues={
                          businessDetailsState?.logo ? transformAttachmentStructure([businessDetailsState.logo], 'toFileLibraryListItem') :
                            undefined
                        }
                      />
                    )}
                  </div>
                </div>
                <h4>Address Details</h4>
                <ValidatedField
                  label={'Street'}
                  id="details-address-street"
                  name="address.street"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}

                />
                <ValidatedField
                  label={'City'}
                  id="details-address-city"
                  name="address.city"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}

                />
                <ValidatedField
                  label={'State'}
                  id="details-address-state"
                  name="address.state"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}

                />
                <ValidatedField
                  label={'PostalCode'}
                  id="details-address-postalCode"
                  name="address.postalCode"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}

                />

                <h4>Contact Details</h4>
                <ValidatedField
                  label={'Email'}
                  id="details-address-email"
                  name="email"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}
                />
                <ValidatedField
                  label={'Phone Number'}
                  id="details-address-phone-number"
                  name="phoneNumber"
                  data-cy="value"
                  type="text"
                  validate={{
                    maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
                  }}
                  onChange={handleFieldChange}
                />

                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </ValidatedForm>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default BusinessDetailUpdate;
