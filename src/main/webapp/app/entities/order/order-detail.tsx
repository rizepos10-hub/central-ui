import React, { useEffect } from 'react';
import { Container, Row, Col, Table, Card, CardBody, CardTitle, Spinner, Badge, CardFooter } from 'reactstrap';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeProcessingStatus, createBill, getEntity } from './order.reducer';
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IOrderedAddon } from 'app/shared/model/ORDER/ordered-addon.model';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { OrderedItems } from './ordered-items';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { Dropdown } from 'primereact/dropdown';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';

export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();


  const { id } = useParams<'id'>();
  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const loading = useAppSelector(state => state.order.loading);

  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items) ? orderEntity.items.filter(item => item.archived !== true) : [],
  };

  const [dataTableValues, setDataTableValues] = React.useState([]);
  const [editMode, setEditMode] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState(filteredOrderEntity.processingStatus);
  const [processStatusTipAmount, setProcessStatusTipAmount] = React.useState(0);

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);


  useEffect(() => {
    const newDataTableValues = [];
    filteredOrderEntity?.items?.forEach((item) => {
      newDataTableValues.push({
        id: item.id,
        itemName: item.itemName,
        amount: item.amount,
        price: item.price,
        taxIdsToValues: item.taxIdsToValues,
        discount: item.discount,
        taxValue: item.taxValue,
        isAddon: false,
        total: item.total?.toFixed(2),
      });
      item.addons.forEach((addon) => {
        newDataTableValues.push({
          id: addon.id,
          itemName: addon.name,
          amount: addon.amount,
          price: addon.price,
          taxIdsToValues: addon.taxIdsToValues,
          discount: addon.discount,
          taxValue: addon.taxValue,
          isAddon: true,
          total: addon.total?.toFixed(2),
        });
      });
    });
    setDataTableValues(newDataTableValues);
  }, [orderEntity])

  const changePaymentStatusConfirm = () => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: acceptPaymentStatusConfirm,
      // reject
    });
  };

  const acceptPaymentStatusConfirm = () => {
    dispatch(createBill({
      id: filteredOrderEntity.id,
      tipAmount: processStatusTipAmount
    }));
  };

  const changeProcessingStatusConfirm = (status) => {
    confirmDialog({
      message: `Are you sure you want to change the status to ${status}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => acceptProcessingStatusConfirm(status),
      // reject
    });
  };

  const acceptProcessingStatusConfirm = (status) => {
    dispatch(changeProcessingStatus({
      id: filteredOrderEntity.id,
      orderProcessingStatus: status ? status : processingStatus,
    }));
  };

  useEffect(() => {
    console.log(1)
    setProcessingStatus(filteredOrderEntity.processingStatus);
  }, [filteredOrderEntity.processingStatus])

  if (loading) {
    return <Spinner />;
  }
  console.log(processingStatus, 'processingStatus')
  return (
    <Container className='p-1'>
      <div className="d-flex align-items-center gap-4">
        <button type="button" className="btn btn-outline-secondary btn-icon">
          <FaArrowLeft size={16} />
          <span className="visually-hidden">Back</span>
        </button>
        <h1 className="fw-semibold fs-5 md:fs-6">
          #3102 - <span className="fw-normal text-muted">Sophia Anderson</span>
          <span className="fw-normal text-muted">on June 23, 2022</span>
        </h1>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-icon">
            <FaChevronLeft size={16} />
            <span className="visually-hidden">Previous</span>
          </button>
          <button type="button" className="btn btn-outline-secondary btn-icon">
            <FaChevronRight size={16} />
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>
      <Container className="mt-4 p-1 gap-4 d-flex flex-column">
        <Row>
          {/* Order Details */}
          <Col md="8">
            <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h5">Order Details</CardTitle>
                {dataTableValues && dataTableValues.length > 0 && (
                  <OrderedItems dataTableValues={dataTableValues} />
                )}
              </CardBody>
              <CardFooter className="fs-5 fw-bold">
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Discount:
                  </span>
                  <span>
                    {orderEntity?.totalDiscount?.toFixed(2)}
                  </span>
                </div>
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Taxes:
                  </span>
                  <span>
                    {orderEntity?.totalTaxes?.toFixed(2)}
                  </span>
                </div>
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Total:
                  </span>
                  <span>
                    {orderEntity?.total?.toFixed(2)}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </Col>

          {/* Customer Information */}
          <Col md="4" className='overflow-auto'>
            <Card className='p-1'>
              <CardBody>
                <CardTitle tag="h5">Order status</CardTitle>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <label>Order time : </label>
                    <span>
                      {filteredOrderEntity.createdDate ? new Date(filteredOrderEntity.createdDate).toDateString() : ''}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label>Payment Status : </label>
                    {filteredOrderEntity.paymentStatus === PaymentStatus.PAID ? (
                      <Badge color="success" pill>
                        {filteredOrderEntity.paymentStatus}
                      </Badge>
                    ) : (
                      editMode ? (
                        <div className="d-flex gap-2 align-items-end">
                          <div className="d-flex flex-column gap-2">
                            <label>
                              <strong>Tip Amount</strong>
                            </label>
                            <InputNumber
                              value={processStatusTipAmount}
                              onChange={(e) => setProcessStatusTipAmount(e.value)}
                              min={0}
                              minFractionDigits={2}
                              className="w-100"
                              inputStyle={{
                                width: '100px'
                              }}
                            />
                          </div>
                          <div>
                            <Button
                              color="danger"
                              size='small'
                              onClick={() => {
                                changePaymentStatusConfirm();
                              }}
                              className="p-1 w-100"
                            >
                              Pay Now
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Badge
                          color="danger"
                          pill
                          className={`${editMode ? 'cursor-pointer' : ''}`}
                        >
                          {filteredOrderEntity.paymentStatus}
                        </Badge>
                      )
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label>Processing Status : </label>
                    {editMode && processingStatus ? (
                      <Dropdown
                        options={Object.values(OrderStatus).map(status => ({
                          label: status,
                          value: status,
                          id: status
                        }))}
                        value={processingStatus}
                        onChange={(e) => {
                          setProcessingStatus(e.value);
                          changeProcessingStatusConfirm(e.value);
                        }}
                        placeholder="Select a status"
                        style={{
                          width: "150px"
                        }}
                      />
                    ) : (
                      <span>
                        {filteredOrderEntity.processingStatus}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label>Delivery Status : </label>
                    <span>
                      Delivered
                    </span>
                  </div>
                  <div>
                    <ConfirmDialog />
                    <Button
                      color="secondary"
                      onClick={() => setEditMode(prev => !prev)}
                    >
                      {editMode ? 'View' : 'Edit'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h5">Customer</CardTitle>
                {filteredOrderEntity.customer ? (
                  <>
                    <p><a href="#">{filteredOrderEntity.customer.firstName + ' ' + filteredOrderEntity.customer.lastName}</a></p>
                    <p>23 total orders</p>
                  </>
                ) : (
                  <p>No customer found</p>
                )}
              </CardBody>
            </Card>

            {filteredOrderEntity.customer && (
              <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
                <CardBody>
                  <CardTitle tag="h6">Contact information</CardTitle>
                  <p>{filteredOrderEntity.customer.email}</p>
                  <p>{filteredOrderEntity.customer.phone}</p>
                </CardBody>
              </Card>
            )}

            <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h6">Shipping address</CardTitle>
                <p>Sophia Anderson</p>
                <p>1234 Main St.</p>
                <p>Anytown, CA 12345</p>
              </CardBody>
            </Card>

            <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h6">Billing address</CardTitle>
                <p>Same as shipping address</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h5">Bills</CardTitle>
                <Table borderless>
                  <tbody>
                    {filteredOrderEntity?.bills?.map((bill, idx) => {

                      const newDataTableValues = [];
                      console.log(bill)
                      bill?.billItems?.forEach((item) => {
                        newDataTableValues.push({
                          id: item.id,
                          itemName: item.itemName,
                          amount: item.amount,
                          price: item.price,
                          taxIdsToValues: item.taxIdsToValues,
                          discount: item.discount,
                          taxValue: item.taxValue,
                          isAddon: false,
                          total: item.total?.toFixed(2),
                        });
                        console.log(newDataTableValues, 'newDataTableValues')
                        item.addons?.forEach((addon) => {
                          newDataTableValues.push({
                            id: addon.id,
                            itemName: addon.name,
                            amount: addon.amount,
                            price: addon.price,
                            taxIdsToValues: addon.taxIdsToValues,
                            discount: addon.discount,
                            taxValue: addon.taxValue,
                            isAddon: true,
                            total: addon.total?.toFixed(2),
                          });
                        });
                      });

                      return (
                        <Accordion activeIndex={idx} key={idx} className='w-100'>
                          <AccordionTab header={new Date(bill.dateTime).toDateString()} className='w-100'>
                            <p className="m-0">
                              <OrderedItems dataTableValues={newDataTableValues} />
                            </p>
                          </AccordionTab>
                        </Accordion>
                      )
                    })}
                    {/* <tr>
                      <td><strong>Total</strong></td>
                      <td className="text-right"><strong>$329.00</strong></td>
                    </tr> */}
                  </tbody>
                </Table>
                {/* <Button color="primary" className="mr-2">Collect payment</Button>
                <Button color="secondary">Send invoice</Button> */}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container >
  );
};

export default OrderDetail;
