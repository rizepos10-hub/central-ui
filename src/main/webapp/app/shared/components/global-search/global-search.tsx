import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { MenuItem, model } from 'app/shared/sidebar/AppMenu';
import { getTenant } from 'app/shared/tenant/TenantContext';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { removeShortcut, saveShortcut } from './global-search.reducer';
import { FaMinus, FaPlus } from 'react-icons/fa';

const GlobalSearch = ({ data }: { data: MenuItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const inputRef = useRef(null);
    const tenant = useAppSelector(state => state.tenant.tenant);
    const dispatch = useAppDispatch();

    const shortcuts = useAppSelector(state => state.shortcuts.shortcuts);

    const isShortcutAdded = (item: MenuItem) => {
        return shortcuts.some(shortcut => shortcut.to === item.to);
    };

    const findItemInModel = (model: MenuItem[], targetTo: string): MenuItem | undefined => {
        for (const item of model) {
            if (item.to === targetTo) {
                return item;
            }
            if (item.items && item.items.length > 0) {
                const found = findItemInModel(item.items, targetTo);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    };

    const handleShortcutToggle = (item: MenuItem) => {
        const fullItem = findItemInModel(model, item.to);

        console.log(fullItem)
        if (isShortcutAdded(fullItem)) {
            dispatch(removeShortcut(fullItem.to));
        } else {
            dispatch(saveShortcut(fullItem));
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current.focus(), 100); // Focus after modal opens
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        dispatch(getTenant);
    }, []);

    const searchItems = (items, query) => {
        return items
            .map((item) => {
                if (
                    item.label.toLowerCase().includes(query.toLowerCase()) ||
                    (item.items && searchItems(item.items, query).length > 0)
                ) {
                    return {
                        ...item,
                        items: item.items ? searchItems(item.items, query) : [],
                    };
                }
                return null;
            })
            .filter((item) => item !== null);
    };

    useEffect(() => {
        if (query) {
            const results = searchItems(data, query);
            setFilteredData(results);
        } else {
            setFilteredData([]);
        }
    }, [query]);


    const toggle = () => setIsOpen(!isOpen);

    return (
        <>
            <Modal isOpen={isOpen} toggle={toggle} size="lg" style={{
                top: '10vh',
            }}>
                <ModalHeader toggle={toggle}>
                    <div className="p-inputgroup">
                        <i className="pi pi-search p-inputgroup-addon" />
                        <InputText
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search docs"
                        />
                    </div>
                </ModalHeader>
                <ModalBody>
                    {shortcuts.length > 0 && (
                        <>
                            <h5>
                                Saved Shortcuts
                            </h5>
                            {shortcuts.map((item) => (
                                <li key={item.to} className="list-group-item" style={{ paddingLeft: '0.5rem' }}>
                                    {item.label}
                                    <span onClick={() => handleShortcutToggle(item)} style={{ cursor: 'pointer', marginLeft: '10px' }}>
                                        {isShortcutAdded(item) ? <FaMinus /> : <FaPlus />}
                                    </span>
                                </li>
                            ))}
                            <hr />
                        </>
                    )}
                    {filteredData.length === 0 && <p>No recent searches</p>}
                    {filteredData.map((parent) => (
                        <div key={parent.to}>
                            <h5>
                                <i className={parent.icon} /> {parent.label}
                            </h5>
                            <ul className="list-group list-group-flush">
                                {parent.items.map((item) => (
                                    <li key={item.to} className="list-group-item">
                                        <i className="pi pi-angle-right" />{' '}
                                        <a href={`${tenant}${item.to}`}>
                                            {item.label}
                                        </a>
                                        <span onClick={() => handleShortcutToggle(item)} style={{ cursor: 'pointer', marginLeft: '10px' }}>
                                            {isShortcutAdded(item) ? <FaMinus /> : <FaPlus />}
                                        </span>
                                        {item.items && item.items.length > 0 && (
                                            <ul className="list-group list-group-flush">
                                                {item.items.map((subItem) => (
                                                    <li key={subItem.label} className="list-group-item">
                                                        <i className="pi pi-angle-double-right" />{' '}
                                                        <a href={`${tenant}${subItem.to}`}>{subItem.label}</a>
                                                        <span onClick={() => handleShortcutToggle(subItem)} style={{ cursor: 'pointer', marginLeft: '10px' }}>
                                                            {isShortcutAdded(subItem) ? <FaMinus /> : <FaPlus />}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </ModalBody>
            </Modal>
        </>
    );
};

export default GlobalSearch;
