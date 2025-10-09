import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IMenu, IMenuScreen } from 'app/shared/model/menu.model';
import { updateEntity, createEntity, reset, sendEvent, duplicateMenu, getEntity } from './menu.reducer';
import { APP_DATE_FORMAT } from 'app/config/constants';
import MenuScreens from './components/menu-screens';
import MenuUpdate from './menu-update';
import Visibility from "app/shared/Visibility/Visibility";
import { IVisibility } from 'app/shared/model/visibility.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IAttachment } from 'app/shared/model/attachment.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit2, Zap, Copy, ArrowLeftRight, Eye } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { TextFormat } from 'react-jhipster';

export interface IMenuData {
    name: string;
    branches: IBranch[];
    menuScreens: IMenuScreen[];
    visibilities: IVisibility[];
    rowHeight: any[];
    id: string;
    numberOfColumns: number;
    image: IAttachment;
}

const MenuInstance = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const { id } = useParams<'id'>();
    const isNew = id === undefined;

    const menuEntity: IMenu = useAppSelector(state => state.menu.entity);
    const menuCategories = useAppSelector(state => state.menuCategory.entities)
    const loading = useAppSelector(state => state.menu.loading);
    const updating = useAppSelector(state => state.menu.updating);
    const updateSuccess = useAppSelector(state => state.menu.updateSuccess);

    // const [totalPages, setTotalPages] = useState<number>(0)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showVisibility, setShowVisibility] = useState(false);
    const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
    const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<IBranch[]>([]);
    const [selectedName, setSelectedName] = useState("");
    const [selectedAttachment, setSelectedAttachment] = useState<IAttachment>()

    const [data, setData] = useState<IMenuData>({
        name: '',
        branches: [],
        menuScreens: [],
        visibilities: [],
        rowHeight: [],
        id: '',
        numberOfColumns: 1,
        image: null,
    });

    useEffect(() => {
        dispatch(getEntity({ id }))
    }, [
        navigate
    ]);

    useEffect(() => {
        if (menuEntity) {
            const newData: IMenuData = {
                name: menuEntity.name,
                branches: menuEntity.branches,
                menuScreens: menuEntity.menuScreens,
                visibilities: menuEntity.visibilities,
                numberOfColumns: menuEntity.numberOfColumns,
                rowHeight: menuEntity.rowHeight,
                id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
                image: menuEntity.image,
            };
            console.log(newData, 'newData')
            setData(newData);
        }

        if (menuEntity?.branch) {
            setSelectedBranches(menuEntity?.branches)
        }

        return () => {
            reset()
        }
    }, [updateSuccess, menuEntity]);

    const saveEntity = ({
        type
    }: {
        type?: "POS" | "ONLINE_ORDERING";
    } = { type: menuEntity.type }) => {
        const entity = {
            ...menuEntity,
            type: type || menuEntity.type,
            menuScreens: data.menuScreens,
            name: selectedName,
            branches: selectedBranches,
            visibilities: data.visibilities,
            rowHeight: data.rowHeight,
            numberOfColumns: data.numberOfColumns,
            image: selectedAttachment,
        };

        if (isNew) {
            dispatch(createEntity(entity)).then(() => dispatch(getEntity({ id })));
        } else {
            dispatch(updateEntity(entity)).then(() => dispatch(getEntity({ id })));
        }
        setIsModalOpen(false)
    };

    const handleDuplicateAction = () => {
        dispatch(duplicateMenu(id)).then((result: any) => {
            if (result?.payload?.id) {
                navigate(`/menu/${result?.payload?.id}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
            }
        });
        setDuplicateConfirmOpen(false);
    };

    const handleTransferToPOSAction = () => {
        if (menuEntity.type === 'ONLINE_ORDERING') {
            saveEntity({ type: 'POS' });
            navigate(`/menu/${menuEntity.id}/POS/edit?page=1&sort=id,asc`);
        } else {
            saveEntity({ type: 'ONLINE_ORDERING' });
            navigate(`/menu/${menuEntity.id}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
        }
        setTransferConfirmOpen(false);
    }

    return (
        <PageWrapper>
            {menuEntity.id && (
                <MenuUpdate
                    setIsModalOpen={setIsModalOpen}
                    isModalOpen={isModalOpen}
                    saveEntity={saveEntity}
                    updating={updating}
                    selectedBranches={selectedBranches}
                    setSelectedBranches={setSelectedBranches}
                    selectedName={selectedName}
                    setSelectedName={setSelectedName}
                    selectedAttachment={selectedAttachment}
                    setSelectedAttachment={setSelectedAttachment}
                />
            )}

            <Dialog open={showVisibility} onOpenChange={setShowVisibility}>
                <DialogContent className="max-w-2xl p-3">
                    <DialogHeader className="p-2">
                        <DialogTitle className="text-sm font-semibold">Menu Visibility</DialogTitle>
                    </DialogHeader>
                    <div className="p-2">
                        <Visibility
                            initialState={data.visibilities}
                            title={"Menu Visibility"}
                            onStateChanged={(visibilities) => setData(prev => {
                                return { ...prev, visibilities }
                            })}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={duplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
                <AlertDialogContent className="max-w-md p-3">
                    <AlertDialogHeader className="p-2">
                        <AlertDialogTitle className="text-sm font-semibold">Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            Are you sure you want to duplicate this menu?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-1 pt-2">
                        <AlertDialogCancel asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button size="sm" className="h-8 text-xs" onClick={handleDuplicateAction}>Proceed</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
                <AlertDialogContent className="max-w-md p-3">
                    <AlertDialogHeader className="p-2">
                        <AlertDialogTitle className="text-sm font-semibold">Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            Are you sure you want to transfer this menu to {menuEntity.type === 'POS' ? 'Online Ordering' : 'POS'}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-1 pt-2">
                        <AlertDialogCancel asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button size="sm" className="h-8 text-xs" onClick={handleTransferToPOSAction}>Proceed</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="mb-2">
                <CardContent className="p-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                            <p className="text-xs text-muted-foreground mb-0.5">Menu</p>
                            <p className="text-sm font-semibold">{menuEntity.name}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">Created At</p>
                            <p className="text-xs font-medium">
                                {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : '-'}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">Updated At</p>
                            <p className="text-xs font-medium">
                                {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : '-'}
                            </p>
                        </div>
                        <div className="col-span-5 flex gap-1 justify-end">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setIsModalOpen(prev => !prev)}>
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                            </Button>
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => { dispatch(sendEvent(id)) }}>
                                <Zap className="h-3 w-3 mr-1" />
                                Trigger
                            </Button>
                            <Button variant="secondary" size="sm" className="h-7 text-xs px-2" onClick={() => setDuplicateConfirmOpen(true)}>
                                <Copy className="h-3 w-3 mr-1" />
                                Duplicate
                            </Button>
                            <Button variant="secondary" size="sm" className="h-7 text-xs px-2" onClick={() => setTransferConfirmOpen(true)}>
                                <ArrowLeftRight className="h-3 w-3 mr-1" />
                                Transfer to {menuEntity.type === 'POS' ? 'Online' : 'POS'}
                            </Button>
                            <Button variant="secondary" size="sm" className="h-7 text-xs px-2" onClick={() => setShowVisibility(prev => !prev)}>
                                <Eye className="h-3 w-3 mr-1" />
                                Visibility
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <MenuScreens
                menu={menuEntity}
                data={data}
                setData={setData}
                saveEntity={saveEntity}
                reset={reset}
                loading={loading}
                updating={updating}
            />
        </PageWrapper>
    )
}

export default MenuInstance
