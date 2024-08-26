import React, { useEffect } from 'react';
import { Container, Row, Col, Table, Card, CardBody, CardTitle, Spinner, Badge, CardFooter } from 'reactstrap';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeDeliveryStatus, changeProcessingStatus, createBill, getEntity, refundBill } from './order.reducer';
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from 'primereact/button';
import { OrderedItems } from './ordered-items';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { Dropdown } from 'primereact/dropdown';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { changeEntityField as changeBillEntityField, reset } from '../bill/bill.reducer';
import { RiRefund2Line } from 'react-icons/ri';
import { DeliverStatus } from 'app/shared/model/ENUMS/delivery-status.model';

export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();


  const { id } = useParams<'id'>();
  const orderEntity: IOrder = useAppSelector(state => state.order.entity);
  const loading = useAppSelector(state => state.order.loading);
  const billEntity: IBill = useAppSelector(state => state.bill.entity);

  const filteredOrderEntity = {
    ...orderEntity,
    items: orderEntity.items && Array.isArray(orderEntity.items) ? orderEntity.items.filter(item => item.archived !== true) : [],
  };

  const [dataTableValues, setDataTableValues] = React.useState([]);
  const [editMode, setEditMode] = React.useState(false);
  const [refundMode, setRefundMode] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState(filteredOrderEntity.processingStatus);
  const [deliveryStatus, setDeliveryStatus] = React.useState(filteredOrderEntity.deliveryStatus);
  const [processStatusTipAmount, setProcessStatusTipAmount] = React.useState(0);
  const [rowClick, setRowClick] = React.useState(true);

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
      reject: rejectProcessingStatusConfirm
    });
  };

  const rejectProcessingStatusConfirm = () => {
    setProcessingStatus(filteredOrderEntity.processingStatus);
  };

  const acceptProcessingStatusConfirm = (status) => {
    dispatch(changeProcessingStatus({
      id: filteredOrderEntity.id,
      orderProcessingStatus: status ? status : processingStatus,
    })).then(res => {
      // @ts-expect-error -- unknown type
      if (res?.error?.status as unknown !== 200) {
        setProcessingStatus(filteredOrderEntity.processingStatus)
      }
    });
  };

  const changeDeliveryStatusConfirm = (status) => {
    confirmDialog({
      message: `Are you sure you want to change the status to ${status}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => acceptDeliveryStatusConfirm(status),
      reject: rejectDeliveryStatusConfirm
    });
  };

  const rejectDeliveryStatusConfirm = () => {
    setDeliveryStatus(filteredOrderEntity.deliveryStatus);
  };

  const acceptDeliveryStatusConfirm = (status) => {
    dispatch(changeDeliveryStatus({
      id: filteredOrderEntity.id,
      deliveryStatus: status ? status : deliveryStatus,
    })).then(res => {
      // @ts-expect-error -- unknown type
      if (res?.error?.status as unknown !== 200) {
        setDeliveryStatus(filteredOrderEntity.deliveryStatus)
      }
    });
  };

  useEffect(() => {
    setProcessingStatus(filteredOrderEntity.processingStatus);
  }, [filteredOrderEntity.processingStatus])

  useEffect(() => {
    setDeliveryStatus(filteredOrderEntity.deliveryStatus);
  }, [filteredOrderEntity.deliveryStatus])

  const handleRefund = (bill: IBill) => {
    dispatch(refundBill({
      id: filteredOrderEntity.id,
      billId: bill.id,
      items: billEntity.items,
      paymentType: bill.paymentType,
      chargesShares: bill.chargesShares,
    }))
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container className='p-1'>
      <div className="d-flex align-items-center gap-4">
        <button type="button" className="btn btn-outline-secondary btn-icon" onClick={() => navigate(-1)}>
          <FaArrowLeft size={16} />
          <span className="visually-hidden">Back</span>
        </button>
        <h1 className="fw-semibold fs-5 md:fs-6">
          #{orderEntity?.sequenceNumber} - <span className="fw-normal text-muted">{orderEntity?.customer?.firstName} {orderEntity?.customer?.lastName}</span>
          <span className="fw-normal text-muted">on {filteredOrderEntity.createdDate ? new Date(filteredOrderEntity.createdDate).toDateString() : ''}</span>
        </h1>
        {/* <div className="ms-auto d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary btn-icon">
            <FaChevronLeft size={16} />
            <span className="visually-hidden">Previous</span>
          </button>
          <button type="button" className="btn btn-outline-secondary btn-icon">
            <FaChevronRight size={16} />
            <span className="visually-hidden">Next</span>
          </button>
        </div> */}
      </div>
      <Container className="mt-4 p-1 gap-4 d-flex flex-column">
        <Row>
          {/* Order Details */}
          <Col md="8">
            <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h5" className="d-flex justify-content-between align-items-center">
                  <span>
                    Order Details
                    {orderEntity?.refund && <span className="text-success">{" "}(Refunded)</span>}
                  </span>
                  <span>
                    {orderEntity?.refund && <div>
                      <RiRefund2Line color='green' size={28} />
                    </div>}
                  </span>
                </CardTitle>
                {dataTableValues && dataTableValues.length > 0 && (
                  <OrderedItems dataTableValues={dataTableValues} />
                )}
              </CardBody>
              <CardFooter className="fs-5 fw-bold">
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Items:
                  </span>
                  <span className='text-success'>
                    + {orderEntity?.itemsTotal?.toFixed(2)}
                  </span>
                </div>
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Addons:
                  </span>
                  <span className='text-success'>
                    + {orderEntity?.addonsTotal?.toFixed(2)}
                  </span>
                </div>
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Taxes:
                  </span>
                  <span className='text-success'>
                    + {orderEntity?.totalTaxes?.toFixed(2)}
                  </span>
                </div>
                <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                  <span>
                    Discount:
                  </span>
                  <span className='text-danger'>
                    - {orderEntity?.totalDiscount?.toFixed(2)}
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
                  {orderEntity?.deliveryStatus != null && (
                    <div className="d-flex align-items-center gap-2">
                      <label>Delivery Status : </label>
                      {editMode && deliveryStatus ? (
                        <Dropdown
                          options={Object.values(DeliverStatus).map(status => ({
                            label: status,
                            value: status,
                            id: status
                          }))}
                          value={deliveryStatus}
                          onChange={(e) => {
                            setDeliveryStatus(e.value);
                            changeDeliveryStatusConfirm(e.value);
                          }}
                          placeholder="Select a status"
                          style={{
                            width: "150px"
                          }}
                        />
                      ) : (
                        <span>
                          {filteredOrderEntity.deliveryStatus}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    {!orderEntity?.refund && (
                      <Button
                        color="secondary"
                        onClick={() => setEditMode(prev => !prev)}
                      >
                        {editMode ? 'View' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h5">Customer</CardTitle>
                {filteredOrderEntity.customer ? (
                  <>
                    <p>
                      <Button
                        text
                        className="text-decoration-none p-0"
                        onClick={() => navigate(`/customer/${filteredOrderEntity.customer.id}/edit?page=1&sort=id,asc`)}
                      >
                        {filteredOrderEntity.customer.firstName + ' ' + filteredOrderEntity.customer.lastName}
                      </Button>
                      {/* </a> */}
                    </p>
                    {/* <p>23 total orders</p> */}
                    <p>{filteredOrderEntity.customer.email}</p>
                    <p>{filteredOrderEntity.customer.phone}</p>
                  </>
                ) : (
                  <p>No customer found</p>
                )}
              </CardBody>
            </Card>
            {/* 
            {filteredOrderEntity.customer && (
              <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
                <CardBody>
                  <CardTitle tag="h6">Contact information</CardTitle>

                </CardBody>
              </Card>
            )} */}

            {/* <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
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
            </Card> */}
          </Col>
        </Row>
        {!orderEntity?.refund && orderEntity?.bills?.length > 0 && (
          <Row>
            <Col md="12">
              <Card className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
                <CardBody>
                  <CardTitle tag="h5">
                    Bills
                  </CardTitle>
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
                            <AccordionTab header={
                              <div className="d-flex justify-content-between align-items-center">
                                <span>
                                  {new Date(bill.dateTime).toDateString()}
                                </span>
                                <span className='d-flex align-items-center justify-content-center gap-2'>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setRefundMode(prev => !prev);
                                    }}
                                  >
                                    {refundMode ? 'Cancel' : 'Refund'}
                                  </Button>
                                  {refundMode && (
                                    <Button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRefund(bill)
                                      }}
                                    >
                                      Apply Refund
                                    </Button>
                                  )}
                                </span>
                              </div>
                            } className='w-100'>
                              <Card className='p-1'>
                                <CardBody className="m-0">
                                  <OrderedItems
                                    dataTableValues={newDataTableValues}
                                    rowClick={rowClick}
                                    entity={billEntity}
                                    changeEntityField={changeBillEntityField}
                                    refundMode={refundMode}
                                  />
                                </CardBody>
                                <CardFooter className="fs-5 fw-bold px-5">
                                  {/* <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                    <span>
                                      Items:
                                    </span>
                                    <span className='text-success'>
                                      + {orderEntity?.itemsTotal?.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                    <span>
                                      Addons:
                                    </span>
                                    <span className='text-success'>
                                      + {orderEntity?.addonsTotal?.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                    <span>
                                      Taxes:
                                    </span>
                                    <span className='text-success'>
                                      + {orderEntity?.totalTaxes?.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                    <span>
                                      Discount:
                                    </span>
                                    <span className='text-danger'>
                                      - {orderEntity?.totalDiscount?.toFixed(2)}
                                    </span>
                                  </div> */}
                                  <div className="mb-0 w-100 d-flex justify-content-between align-items-center">
                                    <span>
                                      Total:
                                    </span>
                                    <span>
                                      {bill?.total?.toFixed(2)}
                                    </span>
                                  </div>
                                </CardFooter>
                              </Card>
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
        )}
      </Container>
    </Container >
  );
};

export default OrderDetail;
