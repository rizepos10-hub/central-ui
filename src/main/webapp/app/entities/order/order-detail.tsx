import React, { useEffect, useRef } from 'react';
import { Container, Row, Col, Table, Card, CardBody, CardTitle, Spinner, Badge, CardFooter } from 'reactstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeDeliveryStatus, changeProcessingStatus, createBill, getEntity, refundBill } from './order.reducer';
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from 'primereact/button';
import OrderedItems from './ordered-items';
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
import { useReactToPrint } from 'react-to-print';
import { Dialog } from 'primereact/dialog';
import { toast } from 'react-toastify';
import { Storage } from 'react-jhipster';

export const OrderDetail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const billPrintRef = useRef(null);

  const handleBillPrint = useReactToPrint({
    content: () => billPrintRef.current,
    pageStyle: "@page { size: A4 portrait; margin: 0; }",
  });

  const pagePrintRef = useRef(null);

  const handlePagePrint = useReactToPrint({
    content: () => pagePrintRef.current,
    pageStyle: "@page { size: A4 portrait; margin: 0; }",
    async onBeforeGetContent() {
      await openAllAccordions();
      // loop through all bills 
      filteredOrderEntity?.bills?.forEach((_, idx) => {
        document.getElementById(`actionsTab-${idx}`).style.visibility = 'hidden';
      })
      document.getElementById('orderStatus').style.display = 'none';
      document.getElementById('customer').style.display = 'none';
      if (orderEntity.orderDeliveryDetails) {
        document.getElementById('deliveryDetails').style.display = 'none';
      }
    },
    onAfterPrint() {
      filteredOrderEntity?.bills?.forEach((_, idx) => {
        document.getElementById(`actionsTab-${idx}`).style.visibility = 'visible';
      })
      document.getElementById('orderStatus').style.display = 'block';
      document.getElementById('customer').style.display = 'block';
      if (orderEntity.orderDeliveryDetails) {
        document.getElementById('deliveryDetails').style.display = 'block';
      }
    },
  });

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
  const [showPrintableBillDialog, setShowPrintableBillDialog] = React.useState(false);

  const [activeIndexes, setActiveIndexes] = React.useState<number | number[]>();

  const openAllAccordions = () => {
    return new Promise(resolve => {
      setActiveIndexes(filteredOrderEntity?.bills?.map((_, index) => index));
      setTimeout(resolve, 0); // Resolve immediately after the current call stack clears
    });
  };

  const openOneAccordion = (index: number) => {
    return new Promise(resolve => {
      setActiveIndexes([index]);
      setTimeout(resolve, 0); // Resolve immediately after the current call stack clears
    });
  }

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
      <div ref={pagePrintRef}>
        <style>
          {`
          @media print {
            body,
              html {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
                box-sizing: border-box;
              }
          }
        `}
        </style>
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
                      Service Chagres:
                    </span>
                    <span className='text-success'>
                      + {orderEntity?.orderCharges?.reduce((acc, charge) => acc + charge?.amount, 0).toFixed(2)}
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
              <Card id='orderStatus' className='p-1'>
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
                    <div className='d-flex gap-2'>
                      <Link to={`/order/${filteredOrderEntity.id}/print?dataTableValues=${JSON.stringify(dataTableValues)}`}>
                        <Button
                          link
                          role="link"
                        >
                          Print
                        </Button>
                      </Link>
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

              <Card id='customer' className={`p-1 ${editMode ? 'opacity-50' : ''}`}>
                <CardBody>
                  <CardTitle tag="h5">Customer</CardTitle>
                  {filteredOrderEntity.customer ? (
                    <>
                      <div>
                        <Button
                          text
                          className="text-decoration-none p-0"
                          onClick={() => navigate(`/customer/${filteredOrderEntity.customer.id}/edit?page=1&sort=id,asc`)}
                        >
                          {filteredOrderEntity.customer.firstName + ' ' + filteredOrderEntity.customer.lastName}
                        </Button>
                        {/* </a> */}
                      </div>
                      {/* <div>23 total orders</div> */}
                      <div>{filteredOrderEntity.customer.email}</div>
                      <div>{filteredOrderEntity.customer.phone}</div>
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

              {orderEntity.orderDeliveryDetails && (
                <Card id='deliveryDetails' className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
                  <CardBody>
                    <CardTitle tag="h6">Delviery Details</CardTitle>
                    <div>{new Date(orderEntity.orderDeliveryDetails?.date).toLocaleString()}</div>
                    <div>{orderEntity.orderDeliveryDetails?.driverInformation?.name}</div>
                    <div>{orderEntity.orderDeliveryDetails?.driverInformation?.phone}</div>
                    <div>
                      <a target={'_blank'} rel="noreferrer" href={orderEntity.orderDeliveryDetails?.driverInformation?.trackOrderUrl}>
                        {orderEntity.orderDeliveryDetails?.driverInformation?.trackOrderUrl}
                      </a>
                    </div>
                    <div>
                      Expected Arrival At: {new Date(orderEntity.orderDeliveryDetails?.expectedArrivalAt).toLocaleString()}
                    </div>
                    <div> {orderEntity.orderDeliveryDetails?.integrationDetails?.provider}, {orderEntity.orderDeliveryDetails?.integrationDetails?.tripId}</div>
                  </CardBody>
                </Card>
              )}

              {/*
            <Card className={`mt-1 p-1 ${editMode ? 'opacity-50' : ''}`}>
              <CardBody>
                <CardTitle tag="h6">Billing address</CardTitle>
                <p>Same as shipping address</p>
              </CardBody>
            </Card>*/}
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
                        <Accordion multiple activeIndex={activeIndexes} onTabChange={(e) => setActiveIndexes(e.index)} className='w-100'>

                          {filteredOrderEntity?.bills?.map((bill, idx) => {
                            const newDataTableValues = [];
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
                              <AccordionTab
                                key={idx}
                                header={
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span>
                                      {new Date(bill.dateTime).toDateString()}
                                    </span>
                                    <span>
                                      {bill.status}
                                    </span>
                                    <span id={`actionsTab-${idx}`} className='d-flex align-items-center justify-content-center gap-2'>
                                      <Link to={`/order/${filteredOrderEntity.id}/print/${bill.id}`}>
                                        <Button
                                          // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                          role={'link'}
                                          link
                                        >
                                          Print
                                        </Button>
                                      </Link>
                                      <Button
                                        outlined
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();

                                          fetch(`${SERVER_API_URL}/api/orders/${orderEntity.id}/send-invoice?billId=${bill.id}`, {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${Storage.local.get('jhi-authenticationToken')}`,
                                            },
                                          })
                                            .then((response) => {
                                              console.log(response)
                                              if (!response.ok) {
                                                toast.error("An error occurred");
                                              } else {
                                                toast.success("Email resent successfully");
                                              }
                                            })
                                        }}
                                      >
                                        Resend E-mail
                                      </Button>



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
                                          // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
                                      ref={billPrintRef}
                                      dataTableValues={newDataTableValues}
                                      rowClick={rowClick}
                                      entity={billEntity}
                                      changeEntityField={changeBillEntityField}
                                      refundMode={refundMode}
                                    />
                                  </CardBody>
                                  <CardFooter className="fs-5 fw-bold px-5">
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
                            )
                          })}
                        </Accordion>
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
      </div >
    </Container >
  );
};

export default OrderDetail;
