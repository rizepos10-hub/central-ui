import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, Table, Label, FormGroup } from 'reactstrap';
import { Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ICustomer, IWholesalePriceLine } from 'app/shared/model/CUSTOMER/customer.model';
import {
  getEntity,
  updateEntity,
  createEntity,
  reset,
  changeEntityField,
  updatePrices,
  getPricesForCustomer,
  assignCard,
} from './customer.reducer';
import { Card as PrimeCard } from 'primereact/card';
import { filterOrders } from 'app/entities/order/order.reducer';
import Order from 'app/entities/order/order';
import { getEntities } from 'app/entities/loyalty/loyalty-records.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { searchEntities as getLoyaltCards } from 'app/entities/loyalty-card/loyalty-card.reducer';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import AsyncSelect from 'react-select/async';
import { ILoyaltyCard } from 'app/shared/model/loyalty-card.model';
import { confirmDialog } from 'primereact/confirmdialog';
import { TabPanel, TabView } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { AddressTypeEnum, IAddress } from 'app/shared/model/address.model';
import { v4 as uuidv4 } from 'uuid';
import { COUNTRIES } from './customer-addresses';

export const CustomerUpdate = ({
  firstName,
  isPopUp,
  closePopUp,
}: {
  firstName?: string;
  isPopUp?: boolean;
  closePopUp?: (id) => void;
}) => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const priceLineOptions: (IWholesalePriceLine[keyof IWholesalePriceLine])[] = ['PRICE_1', 'PRICE_2', 'PRICE_3', 'PRICE_4', 'PRICE_5'];

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const { search } = useLocation();
  const fromLocation = new URLSearchParams(search).get('from');

  const customerEntity: ICustomer = useAppSelector(state => state.customer.entity);
  const loyaltyRecord = useAppSelector(state => state.loyalty.entities?.[0]);
  const branchList = useAppSelector(state => state.branch.entities);
  const loyaltyCardsList = useAppSelector(state => state.loyaltycard.entities);
  const wholeSaleBranches = branchList?.filter(branch => branch.wholesale);
  const loading = useAppSelector(state => state.customer.loading);
  const updating = useAppSelector(state => state.customer.updating);
  const updateSuccess = useAppSelector(state => state.customer.updateSuccess);

  const [selectedCardToAssign, setSelectedCardToAssign] = useState(null);
  const [addressDialogOptions, setAddressDialogOptions] = useState<{
    isOpen: boolean;
    address: IAddress | null;
  }>({
    isOpen: false,
    address: null,
  });
  const [currentAddress, setCurrentAddress] = useState<IAddress | null>(null);

  useEffect(() => {
    if (addressDialogOptions.isOpen) {
      setCurrentAddress(addressDialogOptions.address || {});
    }
  }, [addressDialogOptions.isOpen]);

  const handleBranchPriceChange = (branchId, priceLine) => {
    dispatch(
      changeEntityField({
        name: 'wholesalePriceLines',
        value: {
          ...customerEntity.wholesalePriceLines,
          [branchId]: priceLine,
        },
      })
    );
  };

  const loadOptions = (inputValue, callback) => {
    const query = {
      first: 0,
      rows: 10,
      page: 0,
      sortField: null,
      sortOrder: null,
      query: '',
      filters: {
        referenceNumber: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
      },
    };

    const updatedQuery = applyMatchModeMap(query);

    dispatch(
      getLoyaltCards({
        query: updatedQuery,
      })
    ).then(response => {
      const res = response.payload as any;
      const data = res?.data;

      const options = data.map(card => ({
        value: card.referenceNumber,
        label: card.referenceNumber,
        card,
      }));
      callback(options);
    });
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
      const filters = {};
      filters['customer.id'] = { value: id, matchMode: 'EQUALS' };
      const params = {
        first: 0,
        rows: 100,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters,
      };
      dispatch(getEntities(params));
    }

    dispatch(
      getBranches({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, []);

  useEffect(() => {
    if (customerEntity?.loyaltyCard?.id) {
      setSelectedCardToAssign({
        value: customerEntity?.loyaltyCard?.referenceNumber,
        label: customerEntity?.loyaltyCard?.referenceNumber,
        card: customerEntity?.loyaltyCard,
      });
    }
  }, [customerEntity?.loyaltyCard?.id]);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity = {
      ...customerEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(res => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            if (isPopUp) {
              closePopUp(newId);
              return;
            }
            navigate(`/customer/${newId}/edit`);
          }
        }
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/customer/new`);
        }
      });
    }
  };

  const confirmAssignCard = () => {
    confirmDialog({
      message: 'Are you sure you want to assign this card?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => handleAssignCard(),
    });
  };

  const handleAssignCard = () => {
    dispatch(
      assignCard({
        entity: customerEntity,
        cardRefNumber: selectedCardToAssign?.card?.referenceNumber,
      })
    );
  };

  const editColumnTemplate = rowData => {
    return (
      <FontAwesomeIcon
        icon="pencil-alt"
        style={{ cursor: 'pointer', color: 'silver', marginLeft: '0.3rem' }}
        onClick={() => {
          setAddressDialogOptions({
            isOpen: true,
            address: rowData,
          });
        }}
      />
    );
  };

  const handleDeleteAddress = addressToDelete => {
    let updatedAddresses = [...(customerEntity.deliveryAddresses || [])];
    updatedAddresses = updatedAddresses.filter(address => address.id !== addressToDelete.id);

    dispatch(
      changeEntityField({
        name: 'deliveryAddresses',
        value: updatedAddresses,
      })
    );
  };

  const showDeleteConfirmDialog = addressToDelete => {
    confirmDialog({
      message: 'Are you sure you want to delete this address?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept() {
        handleDeleteAddress(addressToDelete);
      },
    });
  };

  const deleteColumnTemplate = rowData => {
    return (
      <FontAwesomeIcon
        icon="trash"
        style={{ cursor: 'pointer', color: 'red', marginLeft: '1rem' }}
        onClick={() => showDeleteConfirmDialog(rowData)}
      />
    );
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-xl text-900 font-bold">
        <Translate contentKey={'common.addresses'}>Addresses</Translate>
      </span>
      <div className="ms-auto">
        <Button
          label={translate('tempApp.addon.createNew')}
          onClick={() => {
            setAddressDialogOptions({
              isOpen: true,
              address: null,
            });
          }}
          disabled={loading}
        >
          &nbsp; Add Address
        </Button>
      </div>
    </div>
  );

  const handleAddressChange = (fieldName, value) => {
    setCurrentAddress(prevState => ({
      ...prevState,
      [fieldName]: value,
    }));
  };

  const handleCloseAddressDialog = () => {
    let updatedAddresses = [...(customerEntity.deliveryAddresses || [])];
    if (currentAddress.id) {
      // Update existing address
      updatedAddresses = updatedAddresses.map(address => {
        if (address.id === currentAddress.id) {
          return currentAddress;
        } else {
          return address;
        }
      });
    } else {
      // Add new address
      currentAddress.id = uuidv4();
      updatedAddresses.push(currentAddress);
    }

    dispatch(
      changeEntityField({
        name: 'deliveryAddresses',
        value: updatedAddresses,
      })
    );

    setAddressDialogOptions({
      isOpen: false,
      address: null,
    });
  };

  return (
    <div>
      <Row>
        <Col md="12">
          <h2 id="tempApp.customer.home.createOrEditLabel" data-cy="CustomerCreateUpdateHeading">
            {isNew ? (
              <Translate contentKey="tempApp.createNewCustomer">Create New Customer</Translate>
            ) : (
              <Translate contentKey="tempApp.editCustomer">Edit Customer</Translate>
            )}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col md="12" className="d-flex flex-column p-3">
          <form>
            <TabView>
              <TabPanel header="Personal Details">
                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-firstName">{translate('tempApp.firstName')}</Label>
                  <InputText
                    id="customer-firstName"
                    value={customerEntity?.firstName || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'firstName', value: e.target.value }))}
                    required={!customerEntity?.businessDetails?.businessName}
                  />
                </div>

                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-lastName">{translate('tempApp.lastName')}</Label>
                  <InputText
                    id="customer-lastName"
                    value={customerEntity?.lastName || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'lastName', value: e.target.value }))}
                  />
                </div>

                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-phone">{translate('tempApp.phone')}</Label>
                  <InputText
                    id="customer-phone"
                    value={customerEntity?.phone || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'phone', value: e.target.value }))}
                  />
                </div>

                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-mobileNumber">{translate('tempApp.mobileNumber')}</Label>
                  <InputText
                    id="customer-mobileNumber"
                    value={customerEntity?.mobileNumber || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'mobileNumber', value: e.target.value }))}
                  />
                </div>

                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-fax">{translate('tempApp.fax')}</Label>
                  <InputText
                    id="customer-fax"
                    value={customerEntity?.fax || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'fax', value: e.target.value }))}
                  />
                </div>

                <div className={'d-flex flex-column mb-3'}>
                  <Label htmlFor="customer-phone">{translate('tempApp.email')}</Label>
                  <InputText
                    id="customer-email"
                    value={customerEntity?.email || ''}
                    onChange={e => dispatch(changeEntityField({ name: 'email', value: e.target.value }))}
                  />
                </div>

                {!isNew && (
                  <div className={'d-flex flex-column mb-3 w-100'}>
                    <Label htmlFor="customer-phone">{translate('tempApp.assignCard')}</Label>
                    <div className="d-flex gap-2 align-items-center w-50">
                      <AsyncSelect
                        cacheOptions
                        loadOptions={loadOptions}
                        defaultOptions
                        value={selectedCardToAssign}
                        onChange={option => {
                          console.log(option);
                          setSelectedCardToAssign(option);
                        }}
                        placeholder="Select a Card"
                        isClearable
                        className="w-50"
                      />
                      <Button
                        label="Assign Card"
                        className="p-button-link"
                        onClick={() => confirmAssignCard()}
                        disabled={!selectedCardToAssign}
                      >
                        {translate('tempApp.assignCard')}
                        <i className="pi pi-plus ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {!isNew && (
                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-phone">{translate('tempApp.loyaltyRecord')}</Label>
                    <InputNumber id="customer-loyaltyRecord" value={loyaltyRecord?.points ?? ''} disabled />
                  </div>
                )}
              </TabPanel>

              <TabPanel header="Addresses">
                <Dialog
                  header="Address Details"
                  visible={addressDialogOptions.isOpen}
                  style={{ width: '50vw' }}
                  onHide={() => {
                    setAddressDialogOptions({
                      isOpen: false,
                      address: null,
                    });
                  }}
                >
                  <Row>
                    <Col md={12}>
                      <div className="d-flex flex-column gap-1">
                        <label>Contact Person Name</label>
                        <InputText
                          value={currentAddress?.contactPersonName || ''}
                          onChange={e => handleAddressChange('contactPersonName', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Phone Number</label>
                        <InputText
                          value={currentAddress?.phoneNumber || ''}
                          onChange={e => handleAddressChange('phoneNumber', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Address</label>
                        <InputText
                          value={currentAddress?.address || ''}
                          onChange={e => handleAddressChange('address', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Address Type</label>
                        <Dropdown
                          value={currentAddress?.addressType || ''}
                          options={Object.values(AddressTypeEnum)}
                          onChange={e => handleAddressChange('addressType', e.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Country/Region</label>
                        <Dropdown
                          value={currentAddress?.country || ''}
                          options={COUNTRIES}
                          optionValue="name"
                          optionLabel="name"
                          onChange={e => handleAddressChange('country', e.value)}
                          style={{ width: '100%' }}
                          filter
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>City</label>
                        <InputText
                          value={currentAddress?.city || ''}
                          onChange={e => handleAddressChange('city', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Street</label>
                        <InputText
                          value={currentAddress?.street || ''}
                          onChange={e => handleAddressChange('street', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>State</label>
                        <InputText
                          value={currentAddress?.state || ''}
                          onChange={e => handleAddressChange('state', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Floor</label>
                        <InputText
                          value={currentAddress?.floor || ''}
                          onChange={e => handleAddressChange('floor', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Postal Code</label>
                        <InputText
                          value={currentAddress?.postalCode || ''}
                          onChange={e => handleAddressChange('postalCode', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Longitude</label>
                        <InputNumber
                          value={currentAddress?.longitude || null}
                          onChange={e => handleAddressChange('longitude', e.value)}
                          inputStyle={{ width: '100%' }}
                          mode="decimal"
                          minFractionDigits={2}
                          maxFractionDigits={8}
                        />
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <label>Latitude</label>
                        <InputNumber
                          value={currentAddress?.latitude || null}
                          onChange={e => handleAddressChange('latitude', e.value)}
                          inputStyle={{ width: '100%' }}
                          mode="decimal"
                          minFractionDigits={2}
                          maxFractionDigits={8}
                        />
                      </div>
                      <div className="mt-3">
                        <Button onClick={handleCloseAddressDialog} color="primary">
                          Save
                        </Button>
                        &nbsp;
                        <Button
                          onClick={() =>
                            setAddressDialogOptions({
                              isOpen: false,
                              address: null,
                            })
                          }
                          color="secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Dialog>

                <DataTable value={customerEntity?.deliveryAddresses} header={header}>
                  <Column field="contactPersonName" header={'Contact Person Name'} />
                  <Column field="phoneNumber" header={'Phone Number'} />
                  <Column field="address" header={'Address'} />
                  <Column field="addressType" header={'Address Type'} />
                  <Column field="country" header={'Country'} />
                  <Column field="city" header={'City'} />
                  <Column field="street" header={'Street'} />

                  <Column
                    header={translate('common.edit')}
                    body={editColumnTemplate}
                    headerStyle={{ width: '1%', alignItems: 'center', alignSelf: 'center' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                  />

                  <Column
                    header={translate('common.delete')}
                    body={deleteColumnTemplate}
                    headerStyle={{ width: '1%' }}
                    bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                  />
                </DataTable>
              </TabPanel>

              <TabPanel header={translate('common.additionalInfo')}>
                <>
                  <h4>{translate('common.additionalInfo')}</h4>
                  <div className={'d-flex flex-column mb-3'}>
                    <Label htmlFor="customer-businessName">{translate('tempApp.businessName')}</Label>
                    <InputText
                      id="customer-businessName"
                      value={customerEntity?.businessDetails?.businessName || ''}
                      onChange={e =>
                        dispatch(
                          changeEntityField({
                            name: 'businessDetails',
                            value: {
                              ...customerEntity.businessDetails,
                              businessName: e.target.value,
                            },
                          })
                        )
                      }
                      required={!customerEntity?.firstName}
                    />
                  </div>
                </>
              </TabPanel>

              <TabPanel header={'Wholesale Price'}>
                {wholeSaleBranches?.length > 0 ? (
                  <>
                    <h4>Wholesale Price</h4>
                    <Table>
                      <thead>
                        <tr>
                          <th>
                            <Translate contentKey={'common.branch'}>Branch</Translate>
                          </th>
                          <th>Price Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wholeSaleBranches.map(branch => {
                          return (
                            <tr key={branch.id}>
                              <td>{branch.name}</td>
                              <td>
                                <Dropdown
                                  placeholder={'Enter Price Line'}
                                  value={customerEntity?.wholesalePriceLines?.[branch.id] || ''}
                                  options={priceLineOptions}
                                  style={{ minWidth: '15rem' }}
                                  onChange={event => handleBranchPriceChange(branch.id, event.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </>
                ) : null}
              </TabPanel>

              <TabPanel header={'Customer Orders'}>
                <h4>{translate('tempApp.customerOrders')}</h4>
                {customerEntity?.id && (
                  <div>
                    <Order customer={customerEntity?.id} />
                  </div>
                )}
              </TabPanel>
            </TabView>

            {!isPopUp ? (
              <>
                <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>
                &nbsp;
                <Button
                  onClick={saveEntity}
                  color="primary"
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  type="submit"
                  disabled={updating}
                >
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                &nbsp;
                <Button
                  onClick={e => saveEntity(e, true)}
                  color="primary"
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  type="submit"
                  disabled={updating}
                >
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </>
            ) : (
              <Button
                onClick={saveEntity}
                color="primary"
                id="save-entity"
                data-cy="entityCreateSaveButton"
                type="submit"
                disabled={updating}
              >
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            )}
          </form>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerUpdate;
