import React, {useEffect, useRef, useState} from "react"
import {useAppDispatch, useAppSelector} from "app/config/store";
import {IAuditLog} from "app/shared/model/audit-log.model";
import {getEntityLogs} from "app/shared/components/logs/audit-logs.reducer";
import { formatDateForDisplay } from "app/shared/util/timezone-utils";
import { Translate } from "react-jhipster";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
    <div ref={containerRef} className="h-3/4 overflow-auto">
      <h4 className="text-sm font-semibold mb-3">Audit Logs</h4>

      {/* Filter Tags (Clickable Actions) */}
      <div className="flex flex-wrap gap-2 mb-3">
        {actionOptions.map((action) => (
          <Badge
            key={action}
            variant={selectedActions.includes(action) ? "default" : "outline"}
            className="cursor-pointer text-xs h-7 px-3"
            onClick={() => toggleFilter(action)}
          >
            {action}
          </Badge>
        ))}
      </div>

      <ol className="space-y-2 list-decimal list-inside">
        {allLogs.length === 0 ? (
          <li className="text-center py-3 text-xs text-muted-foreground border rounded p-2">No logs available</li>
        ) : (
          allLogs.map((log, index) => {
            const isChangeLog = true;
            return (
            <li
              key={index}
              className={`border rounded p-3 text-xs transition-all ${
                hoveredIndex === index ? 'border-primary shadow-sm' : ''
              } ${isChangeLog && "cursor-pointer hover:bg-muted/50"}`}
              onMouseEnter={() => handleMouseEnter(index, isChangeLog)}
              onMouseLeave={() => handleMouseLeave(isChangeLog)}
              onClick={() =>  handleSelectLog(index, isChangeLog)}
            >
              <div className="flex flex-col gap-1">
                <div className="font-semibold">{log.action}</div>

                <div className="text-muted-foreground">
                  {formatDateForDisplay(log.occurredAt)}
                </div>

                <div className="text-muted-foreground">{log.actor}</div>
                  {log?.userMessage && (
                    <div className="text-muted-foreground mt-1">
                      <Translate contentKey={'items.update.stockQuantity.stockQuantityUserMessage'}>User Message: </Translate>  {log.userMessage}
                    </div>
                  )}
              </div>
            </li>
          )})
        )}
      </ol>
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Log Changes</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Property</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">From Value</TableHead>
                  <TableHead className="text-xs">To Value</TableHead>
                  <TableHead className="text-xs">Current Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs?.[selectedLogIndex]?.changes?.map((change, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{change.propertyName}</TableCell>
                    <TableCell className="text-xs">{change.changeType}</TableCell>
                    <TableCell className="text-xs">{change.fromValue}</TableCell>
                    <TableCell className="text-xs">{change.toValue}</TableCell>
                    <TableCell className="text-xs">{change.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditLogs
