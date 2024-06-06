import React, {useEffect, useState} from "react"
import {useAppDispatch, useAppSelector} from "app/config/store";
import {IAuditLog} from "app/shared/model/audit-log.model";
import {getEntityLogs} from "app/shared/components/logs/audit-logs.reducer";
import {convertUtcToLocalDate} from "app/shared/util/date-utils";
import {
  Modal,
  ModalBody,
  ModalHeader, Spinner,
} from "reactstrap";

import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";

type AuditLogsProps = {
  // entity: "PURCHASE_ORDER" | "ORDER" | "TRANSFER_REQUEST";
  entityId: string;
}

const AuditLogs = ({ entityId} :AuditLogsProps) => {
  const dispatch = useAppDispatch();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);



  const logs = useAppSelector(state => state.entityLogs.logs);
  const loading = useAppSelector(state => state.entityLogs.loading);


  useEffect(() => {
    dispatch(getEntityLogs({
      id: entityId,
    }))
  }, [entityId]);


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
    <div className="h-75 overflow-auto">
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
            <DataTable scrollable scrollHeight="400px" value={logs?.[selectedLogIndex]?.changes}>
              <Column header={'Property'} field={'propertyName'} />
              <Column header={'Type'} field={'changeType'} />

              <Column header={'From Value'} field={'fromValue'} />
              <Column header={'To Value'} field={'fromValue'} />
              <Column header={'Current Value'} field={'value'} />
            </DataTable>
          </ModalBody>
        </Modal>
      ) : null}
    </div>
  );
}

export default AuditLogs
