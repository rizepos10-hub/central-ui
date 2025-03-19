import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Container, Row, Col } from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { changeEntityField, reset } from './order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { OrderMethod } from "app/shared/model/ENUMS/order-method.model";
import { getEntitiesByType } from '../settings/branch-registry/branch-registry.reducer';
import { RegisterType } from 'app/shared/model/ENUMS/branch-registry-type';
import { IBranchRegistry } from 'app/shared/model/branch-registry.model';
import { ITill, TillStatus } from 'app/shared/model/till.model';
import { getEntitiesByStatusOpened } from '../settings/branch-registry/till/till.reducer';
import { Badge } from "primereact/badge";

const ChooseBranch = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const ORDER_METHOD = 'orderMethod';
    const orderEntity: IOrder = useAppSelector(state => state.order.entity);
    const branchRegistry: IBranchRegistry[] = useAppSelector(state => state.branchRegistry.entities);
    
    const [tillList, setTillList] = useState<ITill[]>([]);
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
            </Row>
        </Container >
    )
}

export default ChooseBranch