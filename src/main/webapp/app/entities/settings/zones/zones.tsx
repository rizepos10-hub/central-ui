import React, { useCallback, useEffect, useState } from 'react';
import { ControlPosition, Map, MapControl } from '@vis.gl/react-google-maps';

import { PolygonPath, useDrawingManager } from 'app/shared/components/google/hooks/use-drawing-manager';
import { UndoRedoControl } from 'app/shared/components/google/undo-redo-control';
import { changeEntityField, getEntities } from './zones.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IZone } from 'app/shared/model/ZONE/zone.model';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link, useNavigate } from 'react-router-dom';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const Zones = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const zones: IZone[] = useAppSelector(state => state.zones.entities);
  const loading = useAppSelector(state => state.zones.loading);
  const totalItems = useAppSelector(state => state.zones.totalItems);

  useEffect(() => {
    dispatch(getEntities({}))
  }, [])

  return (
    <PageWrapper className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Zones</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-8 text-xs"
            type='button'
            disabled={loading}
            onClick={() => dispatch(getEntities({}))}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
          <Link to='/zones/new'>
            <Button className="h-8 text-xs" disabled={loading}>
              <Plus className="h-4 w-4" />
              Create New Zone
            </Button>
          </Link>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell className="text-xs text-center" colSpan={1}>
                  {loading ? 'Loading...' : 'No zones found'}
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="text-xs">
                    <Link to={`/zones/${zone.id}/edit`} className="text-primary hover:underline">
                      {zone.name}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  )
};

export default Zones;