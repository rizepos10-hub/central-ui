import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Button,
    Modal,
    ModalFooter,
    ModalBody,
    ModalHeader
} from 'reactstrap';
import { Button as PrimeButton } from 'primereact/button';
import { getSortState, TextFormat, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { convertDateTimeFromServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IMenu } from 'app/shared/model/menu.model';
import { updateEntity, createEntity, reset, sendEvent, duplicateMenu, getEntity } from './menu.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getEntities as getTerms } from 'app/entities/term/Menu-Category/menu-category.reducer';
import { getEntities as getItems } from "app/entities/item/all-items.reducer";
import Select from "react-select";
import { IItem } from "app/shared/model/ITEM/item.model";
import { SelectButton } from "primereact/selectbutton";
import { TabPanel, TabView } from 'primereact/tabview';
import MenuTable from './components/menu-table';
import { APP_DATE_FORMAT } from 'app/config/constants';
import MenuScreens from './components/menu-screens';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import MenuUpdate from './menu-update';
import { Dialog } from "primereact/dialog";
import Visibility from "app/shared/Visibility/Visibility";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

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
    const [selectedBranches, setSelectedBranches] = useState<any>();
    const [selectedName, setSelectedName] = useState("");

    const [data, setData]: any = useState({
        name: '',
        branch: '',
        menuScreens: [],
    });

    const searchParams = new URLSearchParams(location.search)
    useEffect(() => {
        dispatch(getEntity({ id }))
    }, [
        navigate
    ]);

    useEffect(() => {
        if (menuEntity) {
            const newData = {
                name: menuEntity.name,
                branch: menuEntity.branch,
                menuScreens: menuEntity.menuScreens,
                visibilities: menuEntity.visibilities
            };
            setData(newData);
        }

        if (menuEntity?.branch) {
            setSelectedBranches({ label: menuEntity?.branch?.name, value: menuEntity?.branch?.id })
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
            branch: selectedBranches?.value ? { id: selectedBranches.value } : null,
            visibilities: data.visibilities
        };

        if (isNew) {
            dispatch(createEntity(entity)).then(() => dispatch(getEntity({ id })));
        } else {
            dispatch(updateEntity(entity)).then(() => dispatch(getEntity({ id })));
        }
        setIsModalOpen(false)
    };

    const confirm1 = () => {
        console.log(1)
        confirmDialog({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => handleDuplicateAction()
        });
    };

    const handleDuplicateAction = () => {
        dispatch(duplicateMenu(id)).then((result: any) => {
            if (result?.payload?.id) {
                navigate(`/menu/${result?.payload?.id}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
            }
        });
    };

    const confirm2 = () => {
        confirmDialog({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => handleTransferToPOSAction()
        });
    };

    const handleTransferToPOSAction = () => {
        if (menuEntity.type === 'ONLINE_ORDERING') {
            saveEntity({ type: 'POS' });
            navigate(`/menu/${menuEntity.id}/POS/edit?page=1&sort=id,asc`);
        } else {
            saveEntity({ type: 'ONLINE_ORDERING' });
            navigate(`/menu/${menuEntity.id}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
        }
    }

    return (
        <div>
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
                />
            )}

            <div className="">
                <div className="card p-1">
                    <div className="row g-3 p-1 align-items-end">
                        <div className="col-3">
                            <p className="text-muted">Menu</p>
                            <p className="fs-5 fw-bold py-0">{menuEntity.name}</p>
                        </div>
                        <div className="col-2">
                            <p className="text-muted">Created At</p>
                            <p className="fs-5 fw-semibold">
                                {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
                            </p>
                        </div>
                        <div className="col-2">
                            <p className="text-muted">Updated At</p>
                            <p className="fs-5 fw-semibold">
                                {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
                            </p>
                        </div>
                        <div className="col-5 mt-3 mt-md-0 d-flex gap-2">
                            <PrimeButton label="Edit" className="p-button-outlined p-1" onClick={() => setIsModalOpen(prev => !prev)} style={{
                                height: '2.5rem',
                            }} />
                            <PrimeButton label="Trigger" className='p-1' onClick={() => { dispatch(sendEvent(id)) }} style={{
                                height: '2.5rem',
                            }} />
                            <PrimeButton label="Duplicate" className="p-button-secondary p-1" onClick={confirm1} style={{
                                height: '2.5rem',
                            }} />
                            <PrimeButton label={`Transfer to ${menuEntity.type === 'POS' ? 'Online Ordering' : 'POS'}`} className="p-button-secondary p-1" onClick={confirm2} style={{
                                height: '2.5rem',
                            }} />

                            <PrimeButton label={`Visibility`} className="p-button-secondary p-1" onClick={() => setShowVisibility(prev => !prev)} style={{
                                height: '2.5rem',
                            }} />
                            <Dialog
                                visible={showVisibility}
                                style={{ width: '50vw' }}
                                onHide={() => setShowVisibility(false)}
                            >
                                <Visibility
                                    initialState={data.visibilities}
                                    title={"Menu Visibility"}
                                    onStateChanged={(visibilities) => setData(prev => {
                                        return { ...prev, visibilities }
                                    })}
                                />
                            </Dialog>
                        </div>
                    </div>
                </div>
                <MenuScreens
                    menu={menuEntity}
                    data={data}
                    setData={setData}
                    saveEntity={saveEntity}
                    reset={reset}
                    loading={loading}
                    updating={updating}
                />
            </div>
        </div >
    )
}

export default MenuInstance
