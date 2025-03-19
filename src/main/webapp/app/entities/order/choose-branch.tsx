import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Container, Row, Col, Card, CardImg, CardBody, CardTitle, InputGroup, InputGroupText, Input } from 'reactstrap';
import { Button } from 'primereact/button';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities as getProducts } from "app/entities/item/retail/product/product.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { changeEntityField, createEntity, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { RiDeleteBin6Fill } from "react-icons/ri";
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { Dropdown } from 'primereact/dropdown';
import { getFinalPrice, getPriceAfterTax } from 'app/shared/util/calculations-utils';
import { Dialog } from 'primereact/dialog';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IVariantPackage } from 'app/shared/model/ITEM/retail/variable-item.model';
import { RadioButton } from 'primereact/radiobutton';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IBranch } from 'app/shared/model/branch.model';
import { toast } from 'react-toastify';
import { Tooltip } from 'primereact/tooltip';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import CustomerUpdate from '../customer/customer-update';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { getEntities as getCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { getEntities as getPricingPoints } from 'app/entities/settings/pricing-point/pricing-point.reducer';
import { IPricingPoint, PricingPointType } from 'app/shared/model/PRICING-POINT/pricing-point';
import { OrderMethod } from "app/shared/model/ENUMS/order-method.model";
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill, TillStatus } from 'app/shared/model/till.model';
import { createEntity as createTill, closeEntity, confirmCloseEntity, getEntitiesByStatusOpened } from '../settings/branch-registry/till/till.reducer';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";

const ChooseBranch = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const ORDER_METHOD = 'orderMethod';
    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
    
    const [till, setTill] = useState<ITill | null>(null);
    const [tillList, setTillList] = useState<ITill[]>([]);
    const [tillStatus, setTillStatus] = useState<TillStatus>(null);
    const getOpenTills = (ids: string[]) => {
        dispatch(
            getEntitiesByStatusOpened(ids)
        ).then((action) => {
            const tillsList = (action?.payload as { data: ITill[] })?.data;
            setTillList(tillsList);
        });
    }

    useEffect(() => {
        const branchRegistryIds = branchRegistry.map(record => record.id);
        getOpenTills(branchRegistryIds);
    }, [branchRegistry])

    const handleRegistryClick = (registry) => {
        checkTillStatus(registry); // Call existing function
        navigate(`/order/create?registerId=${registry?.id}`); // Navigate to new page
    };

    const checkTillStatus = (registry: IBranchRegistry) => {
        dispatch(changeEntityField({
            name: 'branchId',
            value: registry?.branch?.id,
        }))

        const orderMethod = localStorage.getItem(ORDER_METHOD) || OrderMethod.PickUp;
        dispatch(
            changeEntityField({
                name: 'orderMethod',
                value: orderMethod as OrderMethod,
            })
        )

        if (tillList.length === 0) {
            setTillStatus("CLOSED");
            setTill(null);
            return;
        }

        const openedTill = tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id);

        if (openedTill) {
            setTill(openedTill);
            setTillStatus("OPENED");
        } else {
            setTill(null);
            setTillStatus("CLOSED");
        }
    }

    useEffect(() => {
        dispatch(getBranches({}))
        dispatch(
            getEntitiesByType({
                type: RegisterType.ONLINE,
            })
        )
        dispatch(reset())
    }, [])

    return (
        <Container fluid className="d-flex flex-column justify-content-between" style={{
            maxWidth: '1100px',
            margin: '0 auto'
        }}>

            <Row className="h-100">
                <Col md={12} className="d-flex justify-content-between align-items-center">
                {branchRegistry.map((registry) => (
                        <div
                            key={registry.id}
                            className={`p-4 ml-5 border rounded-lg cursor-pointer flex flex-col items-center justify-center ${
                                orderEntity?.branchId === registry?.branch?.id ? 'border-green-500' : 'border-gray-300'
                            }`}
                            onClick={() => handleRegistryClick(registry)}
                        >
                            <div className="text-lg font-semibold">{registry?.branch?.name}</div>
                            <div className="relative ml-4">
                                <Badge
                                    value=""
                                    className={`absolute bottom-0 right-0 h-5 w-5 border-2 border-white rounded-full p-1 ${
                                        tillList.find((till) => till?.registry?.branch?.id === registry?.branch?.id)?.status === "OPENED"
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                />
                            </div>
                        </div>
                    ))}

                </Col>
                <Col md={12} className="d-flex justify-content-between align-items-center">
                    {!orderEntity?.branchId && orderEntity?.items?.length > 0 && (
                        <div className="text-danger">
                            Please select a branch
                        </div>
                    )}
                </Col>  
                {orderEntity?.branchId && (
                    <div style={{ marginTop: "20px" }}>
                        <p>
                        <strong className='f'>Till Status:</strong>{" "}
                            <span
                                className={`font-bold ${
                                tillStatus === "OPENED" ? "text-green-500" : "text-red-500"
                                }`}
                            >
                                {tillStatus || "Checking..."}
                            </span>
                        </p>
                    </div>
                    )}
            </Row>
        </Container >
    )
}

export default ChooseBranch