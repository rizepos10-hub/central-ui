import { ControlPosition, Map, MapControl } from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { UndoRedoControl } from 'app/shared/components/google/undo-redo-control';
import { IZone } from 'app/shared/model/ZONE/zone.model';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { changeEntityField, createEntity, deleteEntity, getEntity, reset, updateEntity } from './zones.reducer';
import { PolygonPath, useDrawingManager } from 'app/shared/components/google/hooks/use-drawing-manager';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { Translate } from 'react-jhipster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const ZonePage = () => {
    const params = useParams();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const isNew = params?.id === undefined;

    const zone: IZone = useAppSelector(state => state.zones.entity);
    const loading = useAppSelector(state => state.zones.loading);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handlePolygonPath = useCallback((path: PolygonPath[]) => {
        dispatch(changeEntityField({ fieldName: 'coordinates', value: path }))
    }, [dispatch]);

    const defaultLatLngs = useMemo(() => zone?.coordinates?.map(coord => ({
        lat: coord.y,
        lng: coord.x
    })), [zone.coordinates]);

    const drawingManager = useDrawingManager(null, handlePolygonPath, defaultLatLngs);


    useEffect(() => {
        if (isNew) {
            dispatch(reset());
        } else {
            dispatch(getEntity(params?.id));
        }
    }, [isNew, params?.id, dispatch]);

    const saveEntity = (e, createNew = false) => {
        e.preventDefault();
        const entity = {
            ...zone,
            coordinates: defaultLatLngs.map(latlng => ({
                x: latlng.lng,
                y: latlng.lat
            })),
        };

        if (isNew) {
            dispatch(createEntity(entity)).then((res) => {
                if (createNew) {
                    dispatch(reset());
                } else {
                    const payload = res?.payload as any;
                    const newId = payload?.data?.id;

                    // @ts-expect-error -- unknown type
                    if (!res?.error) {
                        navigate(`/zones/${newId}/edit`)
                    }
                }
            })
        } else {
            dispatch(updateEntity(entity)).then(() => {
                if (createNew) {
                    navigate(`/zones/new`)
                }
            })
        }
    };

    const deleteZone = (id) => {
        dispatch(deleteEntity(id)).then(() => {
            setShowDeleteDialog(false);
            navigate(-1);
        });
    };

    return (
        <PageWrapper>
            <form  className='flex flex-col gap-4'>
                <div className='flex gap-4'>
                    <div>
                        <Map
                            defaultZoom={3}
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            style={{ width: '600px', height: '600px' }}
                        />

                        <MapControl position={ControlPosition.TOP_CENTER}>
                            <UndoRedoControl drawingManager={drawingManager} />
                        </MapControl>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor="name" className='font-semibold text-xs'>Name</Label>
                            <Input
                                id="name"
                                value={zone.name || ''}
                                onChange={(e) => dispatch(changeEntityField({ fieldName: 'name', value: e.target.value }))}
                                required
                                placeholder='Enter Zone Name'
                                className="h-7 text-xs"
                            />
                        </div>
                        {!isNew ? (
                            <div className='flex flex-col gap-2'>
                                <Label className='font-semibold text-xs'>Delete this zone</Label>
                                <Button
                                    variant="destructive"
                                    className="h-8 text-xs"
                                    type='button'
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    Delete Zone
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div>
                    <div className='flex gap-3 mt-2'>
                        <Button
                            id="cancel-save"
                            data-cy="entityCreateCancelButton"
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            className="h-8 text-xs"
                            type="button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden md:inline">
                                <Translate contentKey="entity.action.back">Back</Translate>
                            </span>
                        </Button>
                        <Button
                            onClick={saveEntity}
                            id="save-entity"
                            data-cy="entityCreateSaveButton"
                            type="submit"
                            className="h-8 text-xs"
                        >
                            <Save className="h-4 w-4" />
                            <Translate contentKey="entity.action.save">Save</Translate>
                        </Button>
                        <Button
                            onClick={(e) => saveEntity(e, true)}
                            id="save-entity-new"
                            data-cy="entityCreateSaveNewButton"
                            type="submit"
                            className="h-8 text-xs"
                        >
                            <Save className="h-4 w-4" />
                            <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                        </Button>
                    </div>
                </div>
            </form>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this zone?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteZone(zone.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    )
}

export default ZonePage