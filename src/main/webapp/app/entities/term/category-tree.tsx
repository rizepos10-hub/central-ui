import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Row, Col, Input } from 'reactstrap';
import { getSortState } from 'react-jhipster';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';

type DynamicCategoryTreeProps = {
    selector: (state: any) => any[];
    loadingSelector?: (state: any) => boolean;
    getEntities: (params: any) => any;
    updateEntity: (entity: any) => any;
    UpdateComponent: React.ComponentType<{ categoryId: any; onSave: (load?: boolean) => void }>;
};

const DynamicCategoryTree: React.FC<DynamicCategoryTreeProps> = ({
    selector,
    loadingSelector,
    getEntities,
    updateEntity,
    UpdateComponent,
}) => {
    const dispatch = useAppDispatch();
    const [nodes, setNodes] = useState<any[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<any>({});
    const [categoryId, setCategoryId] = useState<any>(undefined);
    const location = useLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedNodeKey, setSelectedNodeKey] = useState<any>();
    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );
    const categoryList = useAppSelector(selector);
    const loading = loadingSelector ? useAppSelector(loadingSelector) : false;

    const getAllEntities = () => {
        dispatch(
            getEntities({
                page: paginationState.activePage - 1,
                size: paginationState.itemsPerPage,
                sort: `${paginationState.sort},${paginationState.order}`,
            })
        );
    };

    const ensureParentsExist = (categories: any[]) => {
        const allParents = categories.flatMap(category => category.parents);
        const allParentIds = new Set(allParents.map((parent: any) => parent.id));
        const existingIds = new Set(categories.map(category => category.id));
        const missingParents = Array.from(allParentIds).filter(id => !existingIds.has(id));
        const addedParents = missingParents.map(id => {
            const parent = allParents.find((parent: any) => parent.id === id);
            return {
                id,
                name: parent ? parent.name : `Parent ${id}`,
                parents: [],
                attachments: [],
                accountingGroups: [],
                visibility: null,
                itemsCount: null,
                imageUrl: parent?.attachments?.[0]?.url,
            };
        });
        return [...categories, ...addedParents];
    };

    const buildTree = (categories: any[], parentId: any = null, level = '') => {
        return categories
            .filter(category => {
                const parentMatch =
                    Array.isArray(category.parents) && category.parents.some((parent: any) => parent.id === parentId);
                return parentId === null ? category.parents.length === 0 : parentMatch;
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((category, index) => {
                const key = level ? `${level}-${index}` : `${index}`;
                return {
                    id: category.id,
                    key: category.id,
                    label: `${category.name} (${category?.itemsCount} items)`,
                    imageUrl: category.attachments?.[0]?.url,
                    data: `${category.name} Folder`,
                    children: buildTree(categories, category.id, key),
                };
            });
    };

    useEffect(() => {
        const filteredCategories = search
            ? categoryList.filter(category =>
                category.name.toLowerCase().includes(search.toLowerCase())
            )
            : categoryList;
        const completeCategories = ensureParentsExist(filteredCategories);
        const treeNodes = buildTree(completeCategories);
        setNodes(treeNodes);
    }, [categoryList, search]);

    const sortEntities = () => {
        getAllEntities();
        const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
        if (location.search !== endURL) {
            navigate(`${location.pathname}${endURL}`);
        }
    };

    useEffect(() => {
        sortEntities();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const onSelectionChange = (e: any) => {
        const selectedNode = e.value;
        if (selectedNode !== categoryId) {
            setCategoryId(selectedNode);
        }
        setSelectedNodeKey(selectedNode);
    };

    const updatedTree = (load = true) => {
        setCategoryId(undefined);
        if (load) {
            getAllEntities();
        }
    };

    const expandAll = () => {
        const _expandedKeys: any = {};
        for (const node of nodes) {
            expandNode(node, _expandedKeys);
        }
        setExpandedKeys(_expandedKeys);
    };

    const collapseAll = () => {
        setExpandedKeys({});
    };

    const expandNode = (node: any, _expandedKeys: any) => {
        if (node.children && node.children.length) {
            _expandedKeys[node.key] = true;
            for (const child of node.children) {
                expandNode(child, _expandedKeys);
            }
        }
    };

    // Handler to update visibility for a given source type.
    const handleVisibilityChange = (e, nodeId: any, source: SourceType) => {
        const entity = categoryList.find((c: any) => String(c.id) === String(nodeId));
        if (!entity) return;
        // Clone the array to avoid mutating a read-only object.
        const currentVisibility = Array.isArray(entity.visibility) ? [...entity.visibility] : [];
        const existingIndex = currentVisibility.findIndex((v: any) => v.application === source);
        if (existingIndex !== -1) {
            currentVisibility[existingIndex] = {
                ...currentVisibility[existingIndex],
                visible: e.target.checked,
                schedule: currentVisibility[existingIndex].schedule || {}
            };
        } else {
            currentVisibility.push({
                application: source,
                visible: e.target.checked,
                schedule: {}
            });
        }
        dispatch(updateEntity({ ...entity, visibility: currentVisibility }));
    };
    // Helper to extract the visibility flag for a given source from an array.
    const getVisibilityForSource = (entity: any, source: SourceType): boolean => {
        if (entity && Array.isArray(entity.visibility)) {
            const item = entity.visibility.find((v: any) => v.application === source);
            if (item && typeof item.visible === 'boolean') return item.visible;
        }
        return true; // default is true if not defined
    };


    const nodeTemplate = (node: any, options: any) => {
        const entity = categoryList.find((c: any) => String(c.id) === String(node.id));
        const posVisible = getVisibilityForSource(entity, SourceType.BRANCH_POS);
        const onlineVisible = getVisibilityForSource(entity, SourceType.ONLINE_ORDERING);

        return (
            <div className="d-flex align-items-center gap-2 border-bottom w-100">
                {node.imageUrl && <img src={node.imageUrl} alt={node.label} width={50} height={50} />}
                <span>{node.label}</span>
                <div className="ms-auto d-flex gap-2">
                    <label>
                        <input
                            type="checkbox"
                            checked={posVisible}
                            onChange={(e) => handleVisibilityChange(e, node.id, SourceType.BRANCH_POS)}
                        />
                        POS
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={onlineVisible}
                            onChange={(e) => handleVisibilityChange(e, node.id, SourceType.ONLINE_ORDERING)}
                        />
                        Online Ordering
                    </label>
                </div>
            </div>
        );
    };

    const handleDragDrop = (e: TreeDragDropEvent) => {
        setNodes(e.value);
        if (e.dragNode) {
            const draggedId = e.dragNode.id;
            const siblings = e.dropNode ? e.dropNode.children : e.value;
            const newIndex = e.dropIndex !== undefined ? e.dropIndex : siblings.findIndex((node: any) => String(node.id) === String(draggedId));
            // Helper to get order from categoryList.
            const getOrder = (node: any): number => {
                const cat = categoryList.find((c: any) => String(c.id) === String(node.id));
                return cat?.order ?? 0;
            };
            const sortedSiblings = siblings.slice().sort((a, b) => getOrder(a) - getOrder(b));
            let newOrder = 1;
            if (newIndex === 0) {
                newOrder = getOrder(sortedSiblings[0]) / 2;
            } else if (newIndex >= sortedSiblings.length) {
                newOrder = getOrder(sortedSiblings[sortedSiblings.length - 1]) + 1;
            } else {
                const prevOrder = getOrder(sortedSiblings[newIndex - 1]);
                const nextOrder = getOrder(sortedSiblings[newIndex]);
                newOrder = (prevOrder + nextOrder) / 2;
            }
            const newParentId = e.dropNode ? e.dropNode.id : null;
            const draggedEntity = categoryList.find((c: any) => String(c.id) === String(draggedId));
            if (draggedEntity) {
                const updatedEntity: ITerm = {
                    ...draggedEntity,
                    order: newOrder,
                    parents: newParentId ? [{ id: newParentId }] : [],
                };
                dispatch(updateEntity(updatedEntity));
            }
        }
    };

    return (
        <Row className="justify-content-center">
            <Col md="6" className="p-2">
                <Input type="text" value={search} onChange={handleSearchChange} placeholder="Search..." className="mb-3" />
                <div style={{ marginBottom: '1rem' }}>
                    <Button label="Expand All" icon="pi pi-plus" onClick={expandAll} className="p-button-success" />
                    <Button label="Collapse All" icon="pi pi-minus" onClick={collapseAll} className="p-button-secondary" style={{ marginLeft: '0.5rem' }} />
                </div>
                <Tree
                    nodeTemplate={nodeTemplate}
                    onSelectionChange={onSelectionChange}
                    value={nodes}
                    selectionMode="single"
                    className="w-100"
                    selectionKeys={selectedNodeKey}
                    dragdropScope="demo"
                    onDragDrop={handleDragDrop}
                    expandedKeys={expandedKeys}
                    onToggle={(e) => setExpandedKeys(e.value)}
                />
            </Col>
            <Col md="6" className="p-2">
                <UpdateComponent categoryId={categoryId} onSave={updatedTree} />
            </Col>
        </Row>
    );
};

export default DynamicCategoryTree;
