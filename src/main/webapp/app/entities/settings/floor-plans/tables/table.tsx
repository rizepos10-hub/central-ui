import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSortState } from 'react-jhipster';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';

import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './table.reducer';
import { IFloorPlanTable } from 'app/shared/model/FLOOR-PLAN/floor-plan-table.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, Plus, Pencil, Trash2, QrCode, Copy, Printer, FileText } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { QRCodeSVG } from 'qrcode.react';
import { normalizeStorefrontUrl } from 'app/entities/online-ordering/pages/page-preview-utils';
import { IStorefrontSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { analyticsReportPrintStyles, createReportFileName, downloadElementAsPdf } from 'app/shared/util/report-export-utils';

const tableQrPageStyles = `
  ${analyticsReportPrintStyles('portrait')}

  @media print {
    .table-qr-print-page {
      min-height: calc(297mm - 20mm);
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
    }
  }
`;

export const FloorPlanTable = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const floorPlanTablesList :IFloorPlanTable[] = useAppSelector(state => state.floorPlanTable.entities);
  const loading = useAppSelector(state => state.floorPlanTable.loading);
  const totalItems = useAppSelector(state => state.floorPlanTable.totalItems);

  const [nameFilter, setNameFilter] = useState('');
  const [storefrontUrl, setStorefrontUrl] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<IFloorPlanTable | null>(null);
  const qrExportRef = useRef<HTMLDivElement>(null);

  const filteredList = useMemo(() => {
    return floorPlanTablesList.filter(item => {
      const matchesName = !nameFilter || (item.name || '').toLowerCase().includes(nameFilter.toLowerCase());
      return matchesName;
    });
  }, [floorPlanTablesList, nameFilter]);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };

  useEffect(() => {
    getAllEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort]);

  useEffect(() => {
    axios
      .get<IStorefrontSettings>('api/online-ordering/settings/ui-settings/storefront-settings')
      .then(response => {
        const normalized = normalizeStorefrontUrl(response.data?.domain);
        if (normalized) {
          setStorefrontUrl(normalized);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSyncList = () => {
    getAllEntities();
  };

  const handleCreate = () => {
    navigate('/floor-plan/table/new');
  };

  const getQrUrl = (table: IFloorPlanTable) => {
    const baseUrl = storefrontUrl;
    if (!baseUrl) return '';
    const query = new URLSearchParams({
      tableMode: 'true',
      tables: table.name || table.id,
    });
    return `${baseUrl}/${table.branch?.id}?${query.toString()}`;
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Ignore clipboard failures in unsupported contexts.
    }
  };

  const selectedTableFileName = useMemo(() => {
    if (!selectedTable) {
      return 'table-qr';
    }

    return createReportFileName('table-qr', [selectedTable.name || selectedTable.id]);
  }, [selectedTable]);

  const handlePrint = useReactToPrint({
    content: () => qrExportRef.current,
    documentTitle: selectedTableFileName,
    pageStyle: tableQrPageStyles,
  });

  const handleExportPdf = async () => {
    if (!qrExportRef.current || !selectedTable) {
      return;
    }

    await downloadElementAsPdf(qrExportRef.current, {
      fileName: selectedTableFileName,
      orientation: 'portrait',
    });
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Tables</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSyncList} size="sm" className="h-7 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh List
            </Button>
            <Button onClick={handleCreate} disabled={loading} size="sm" className="h-7 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Add New Table
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Branch</TableHead>
              <TableHead className="text-xs">Width</TableHead>
              <TableHead className="text-xs">Height</TableHead>
              <TableHead className="text-xs">Image</TableHead>
              <TableHead className="text-xs text-center">QR</TableHead>
              <TableHead className="text-xs text-center">Edit</TableHead>
              <TableHead className="text-xs text-center">Delete</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <Input
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs">
                  <Link to={`/floor-plan/table/${row.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    {row?.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{row?.branch?.name}</TableCell>
                <TableCell className="text-xs">{row.dimensions?.width}</TableCell>
                <TableCell className="text-xs">{row.dimensions?.height}</TableCell>
                <TableCell className="text-xs">
                  {row.image?.url && <img height={40} width={40} src={row.image?.url} alt="Table" />}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedTable(row)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/table/${row.id}/edit?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground inline-block cursor-pointer" />
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/floor-plan/table/${row.id}/delete?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`}>
                    <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 inline-block cursor-pointer" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={Boolean(selectedTable)} onOpenChange={open => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Table QR</DialogTitle>
            <DialogDescription>Print, export, or copy the table ordering QR code.</DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <QRCodeSVG value={getQrUrl(selectedTable)} size={220} />
                <div className="text-center">
                  <div className="font-medium">{selectedTable.name || selectedTable.id}</div>
                  <div className="text-sm text-muted-foreground">{selectedTable.branch?.name}</div>
                </div>
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs break-all">{getQrUrl(selectedTable)}</div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => handleCopy(getQrUrl(selectedTable))} data-testid="table-qr-copy">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handlePrint} data-testid="table-qr-print">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button type="button" onClick={handleExportPdf} data-testid="table-qr-export-pdf">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="pointer-events-none fixed -left-[10000px] top-0 w-fit max-w-none bg-white p-6" aria-hidden="true">
        <div ref={qrExportRef} className="table-qr-print-page bg-white">
          {selectedTable && (
            <div className="flex min-h-[calc(297mm-20mm)] w-[190mm] flex-col items-center justify-center gap-6 bg-white px-8 py-10 text-center">
              <QRCodeSVG value={getQrUrl(selectedTable)} size={320} />
              <div className="space-y-2">
                <div className="text-3xl font-semibold">{selectedTable.name || selectedTable.id}</div>
                <div className="text-base text-muted-foreground">{selectedTable.branch?.name || 'No branch assigned'}</div>
              </div>
              <div className="w-full break-all rounded-md border border-slate-300 px-4 py-3 text-sm">
                {getQrUrl(selectedTable)}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default FloorPlanTable;
