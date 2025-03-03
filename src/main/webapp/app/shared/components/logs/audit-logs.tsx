import React, {useEffect, useRef, useState} from "react"
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
import { Translate } from "react-jhipster";

type AuditLogsProps = {
  // entity: "PURCHASE_ORDER" | "ORDER" | "TRANSFER_REQUEST";
  entityId: string;
}
const PAGE_SIZE = 20;

const AuditLogs = ({ entityId} :AuditLogsProps) => {
  const dispatch = useAppDispatch();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedActions, setSelectedActions] = useState([]);
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const loading = useAppSelector(state => state.entityLogs.loading);
  const [allLogs, setAllLogs] = useState([]);
  const actionOptions = ["CREATED", "UPDATED", "DELETED", "PRODUCT_STOCK_UPDATED"];
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

      // If scrolled to bottom, fetch more logs
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        const nextPage = page + 1;
        setPage(nextPage);
        dispatch(getEntityLogs({ id: entityId, sort: "occurredAt,desc", page: nextPage, size: PAGE_SIZE, action: selectedActions.length > 0 ?selectedActions[0] : null }))
          .then((response: any) => {
            if (response.payload.data.length === 0) {
              setHasMore(false); // Stop fetching if no more data
            } else {
              setAllLogs((prevLogs) => [...prevLogs, ...response.payload.data]);
            }
          });
      }
    };

    containerRef.current?.addEventListener("scroll", handleScroll);
    return () => containerRef.current?.removeEventListener("scroll", handleScroll);
  }, [loading, page, hasMore]);

  const toggleFilter = (action: string) => {
    setPage(0);
    setSelectedActions([action]);
    setHasMore(true);
    dispatch(getEntityLogs({ id: entityId, sort: "occurredAt,desc", action, page: 0, size: PAGE_SIZE }))
      .then((response: any) => {
        setAllLogs(response.payload?.data ?? []);
        if (response.payload.data.length === 0) {
          setHasMore(false);
        }
      });
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true); // Reset when entityId changes
    dispatch(
      getEntityLogs({ id: entityId, sort: "occurredAt,desc", page: 0, size: PAGE_SIZE })
    ).then((response: any) => {
      setAllLogs(response.payload.data);
      if (response.payload.data.length === 0) {
        setHasMore(false); // Stop further requests if no logs exist
      }
    });
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

  return (
    <div ref={containerRef} className="h-75 overflow-auto">
      <h4>Audit Logs</h4>

      {/* Filter Tags (Clickable Actions) */}
      <div className="mb-3">
        {actionOptions.map((action) => (
          <span
            key={action}
            className={`badge px-3 py-2 me-2 cursor-pointer ${
              selectedActions.includes(action) ? "bg-primary text-white" : "bg-light text-dark"
            }`}
            onClick={() => toggleFilter(action)}
          >
            {action}
          </span>
        ))}
      </div>

      <ol className="list-group list-group-numbered shadow-sm rounded overflow-hidden">
        {allLogs.length === 0 ? (
          <li className="list-group-item text-center py-3 text-muted">No logs available</li>
        ) : (
          allLogs.map((log, index) => {
            const isChangeLog = true;
            return (
            <li 
            key={index} 
            className={`list-group-item d-flex justify-content-between align-items-start p-3 ${
              hoveredIndex === index ? 'border border-primary shadow-sm' : ''
            } ${isChangeLog && "cursor-pointer"}`}
            onMouseEnter={() => handleMouseEnter(index, isChangeLog)}
            onMouseLeave={() => handleMouseLeave(isChangeLog)}
            onClick={() =>  handleSelectLog(index, isChangeLog)}
            >
              <div className="d-flex flex-column flex-grow-1 ms-2 me-auto">
                <div className="fw-bold text-primary">{log.action}</div>

                <div className="text-end small text-secondary ms-auto">
                {convertUtcToLocalDate(log.occurredAt)}
                </div>

                <div className="text-muted small">{log.actor}</div>
                  {log?.userMessage && (
                    <div className="text-secondary small mt-1">
                      <Translate contentKey={'items.update.stockQuantity.stockQuantityUserMessage'}>User Message: </Translate>  {log.userMessage}</div>
                  )}
              </div>
            </li>
          )})
        )}
      </ol>

      {loading && <Spinner />}
      {showModal ? (
        <Modal isOpen={showModal} toggle={toggleModal} className=" modal-xl modal-dialog-scrollable">
          <ModalHeader toggle={toggleModal}>Log Changes</ModalHeader>
          <ModalBody>
            <DataTable scrollable scrollHeight="400px" value={allLogs?.[selectedLogIndex]?.changes}>
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
