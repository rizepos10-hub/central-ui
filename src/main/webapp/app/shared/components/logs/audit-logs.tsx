import React, {useEffect, useState} from "react"
import {useAppDispatch, useAppSelector} from "app/config/store";
import {getEntityLogs as getPurchaseOrderLogs} from "app/entities/inventory/purchase-order/purchase-order.reducer";
import {getEntityLogs as getTransferRequestLogs} from "app/entities/inventory/transfer-request/transfer-request.reducer";
import {getEntityLogs as getOrderLogs} from "app/entities/order/order.reducer";
import {IAuditLog} from "app/shared/model/audit-log.model";
import {convertUtcToLocalDate} from "app/shared/util/date-utils";
import {
  Modal,
  ModalBody,
  ModalHeader, Spinner,
} from "reactstrap";

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";

type AuditLogsProps = {
  entity: "PURCHASE_ORDER" | "ORDER" | "TRANSFER_REQUEST";
  entityId: string;
}

const AuditLogs = ({entity, entityId} :AuditLogsProps) => {
  const dispatch = useAppDispatch();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const logsMap: Record<typeof entity, { getLogs: () => void; logs: IAuditLog[], loading: boolean }> = {
    PURCHASE_ORDER: {
      logs: useAppSelector(state => state.purchaseOrder.logs),
      loading:  useAppSelector(state => state.purchaseOrder.loadingLogs),
      getLogs: () => dispatch(getPurchaseOrderLogs({
        id: entityId,
      })),
    },
    ORDER: {
      logs: useAppSelector(state => state.order.logs),
      loading:  useAppSelector(state => state.order.loadingLogs),
      getLogs: () => dispatch(getOrderLogs({
        id: entityId,
      })),
    },
    TRANSFER_REQUEST: {
      logs: useAppSelector(state => state.transferRequest.logs),
      loading: useAppSelector(state => state.transferRequest.loadingLogs),
      getLogs: () => dispatch(getTransferRequestLogs({
        id: entityId,
      })),

    },
  };


  const logs = logsMap[entity]?.logs || [];
  const loading = logsMap[entity]?.loading || false;


  useEffect(() => {
    logsMap[entity]?.getLogs();
  }, [entity]);


  const handleMouseEnter = (index: number, isChangeLog :boolean) => {
    if(!isChangeLog) return;
    setHoveredIndex(index);
  };

  const handleMouseLeave = (isChangeLog :boolean) => {
    if(!isChangeLog) return;
    setHoveredIndex(null);
  };

  const toggleModal = () => {
    setShowModal(prev => !prev);
  };

  const handleSelectLog = (index :number, isChangeLog :boolean) => {
    if(!isChangeLog) return;
    setSelectedLogIndex(index);
    toggleModal();
  };

  if(loading) return <Spinner />;


  return (
    <>
      <h4>Audit Logs</h4>
      <ol className="list-group list-group-numbered">
        {logs.length === 0 ? (
          <li className="list-group-item">No logs available</li>
        ) : (
        logs?.map((log, index) => {
          const isChangeLog = true;
          return (
            <li
              key={index}
              className={`list-group-item d-flex justify-content-between align-items-start ${
                hoveredIndex === index ? 'border border-primary' : ''
              } ${isChangeLog && "cursor-pointer"}`}
              onMouseEnter={() => handleMouseEnter(index, isChangeLog)}
              onMouseLeave={() => handleMouseLeave(isChangeLog)}
              onClick={() =>  handleSelectLog(index, isChangeLog)}
            >
              <div className="ms-2 me-auto">
                <div className="fw-bold">{log.action}</div>
                {log.actor}
              </div>
              <span>{convertUtcToLocalDate(log.occurredAt)}</span>
            </li>
          );
        }))}
      </ol>
      {showModal ? (
        <Modal isOpen={showModal} toggle={toggleModal} className=" modal-xl modal-dialog-scrollable">
          <ModalHeader toggle={toggleModal}>Log Changes</ModalHeader>
          <ModalBody>
            <DataTable value={logs?.[selectedLogIndex]?.changes}>
              <Column header={'Property'} field={'propertyName'} />
              <Column header={'Type'} field={'changeType'} />

              <Column header={'From Value'} field={'fromValue'} />
              <Column header={'To Value'} field={'fromValue'} />
              <Column header={'Current Value'} field={'value'} />
            </DataTable>
          </ModalBody>
        </Modal>
      ) : null}
    </>
  );
}

export default AuditLogs
