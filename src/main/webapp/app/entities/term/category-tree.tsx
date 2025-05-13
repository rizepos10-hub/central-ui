import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Row, Col, Input } from 'reactstrap';
import { getSortState } from 'react-jhipster';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITerm } from 'app/shared/model/term.model';

type DynamicCategoryTreeProps = {
    selector: (state: any) => any[];
    loadingSelector?: (state: any) => boolean;
    getEntities: (params: any) => any;
    updateEntity: (entity: any) => any;
    UpdateComponent: React.ComponentType<{ onSave: (load?: boolean) => void }>;
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
    const location = useLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedNodeKey, setSelectedNodeKey] = useState<any>();
    const [paginationState, setPaginationState] = useState(
        overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
    );
    const categoryList = useAppSelector(selector);
    const loading = loadingSelector ? useAppSelector(loadingSelector) : false;

    const [searchParam, setSearchParams] = useSearchParams();
    console.log(categoryList, 'categoryList')
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
                    label: `${category.name} (${category?.itemsCount || 0} items)`,
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

    useEffect(() => {
        console.log(searchParam)
        getAllEntities();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const onSelectionChange = (e: any) => {
        const selectedNode = e.value;
        if (selectedNode !== searchParam.get("categoryId")) {
            setSearchParams({ categoryId: selectedNode });
        }
        setSelectedNodeKey(selectedNode);
    };

    const updatedTree = (load = true) => {
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

    const nodeTemplate = (node: any, options: any) => {
        return (
            <div className="d-flex align-items-center gap-2 border-bottom w-100">
                {node.imageUrl && <img src={node.imageUrl} alt={node.label} width={50} height={50} />}
                <span>{node.label}</span>
            </div>
        );
    };

    const handleDragDrop = (e: TreeDragDropEvent) => {
        setNodes(e.value);
        if (e.dragNode) {
            const draggedId = e.dragNode.id;
            const siblings = e.dropNode ? e.dropNode.children : e.value;
            const newIndex =
                e.dropIndex !== undefined
                    ? e.dropIndex
                    : siblings.findIndex((node: any) => String(node.id) === String(draggedId));
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
                    <Button
                        label="Collapse All"
                        icon="pi pi-minus"
                        onClick={collapseAll}
                        className="p-button-secondary"
                        style={{ marginLeft: '0.5rem' }}
                    />
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
                <UpdateComponent onSave={updatedTree} />
            </Col>
        </Row>
    );
};

export default DynamicCategoryTree;
