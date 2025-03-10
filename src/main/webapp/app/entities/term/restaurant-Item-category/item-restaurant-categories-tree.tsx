import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Row, Col, Input } from 'reactstrap';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities, getEntities } from './item-restaurant-category.reducer';
import UpdateItemRestaurantCategoryTree from './update-item-restaurant-category-tree';

export const ItemRestaurantCategoriesTree = () => {
  const dispatch = useAppDispatch();
  const [nodes, setNodes] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState<any>();
  const [categoryId, setCategoryId] = useState(undefined);
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedNodeKey, setSelectedNodeKey] = useState();
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const categoryList = useAppSelector(state => state.restaurantCategory.entities);
  const loading = useAppSelector(state => state.restaurantCategory.loading);
  const isSaved = useRef(false);

  const totalItems = categoryList.length;

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };

  const ensureParentsExist = (categories) => {
    const allParents = categories.flatMap(category => category.parents);

    const allParentIds = new Set(allParents.map(parent => parent.id));
    const existingIds = new Set(categories.map(category => category.id));

    const missingParents = Array.from(allParentIds).filter(id => !existingIds.has(id));

    const addedParents = missingParents.map(id => {
      const parent = allParents.find(parent => parent.id === id);
      return {
        id,
        name: parent ? parent.name : `Parent ${id}`,
        parents: [],
        attachments: [],
        accountingGroups: [],
        visibility: null,
        itemsCount: null,
        imageUrl: parent?.attachments?.[0]?.url, // if available
      };
    });

    return [...categories, ...addedParents];
  };

  useEffect(() => {
    const completeCategories = ensureParentsExist(categoryList);
    const treeNodes = buildTree(completeCategories);
    setNodes(treeNodes);
  }, [categoryList]);

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    const getData = setTimeout(() => {
      sortEntities();
    }, 2000);
    return () => clearTimeout(getData);
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search]);

  const buildTree = (categories, parentId = null, level = '') => {
    return categories
      .filter(category => {
        const parentMatch = Array.isArray(category.parents) && category.parents.some(parent => parent.id === parentId);
        return parentId === null ? category.parents.length === 0 : parentMatch;
      })
      .map((category, index) => {
        const key = level ? `${level}-${index}` : `${index}`;
        return {
          id: category.id,
          key: category.id,
          label: category.name,
          imageUrl: category.attachments?.[0]?.url, // new property for the category image
          data: `${category.name} Folder`,
          children: buildTree(categories, category.id, key),
        };
      });
  };

  console.log(categoryList, 'categorylist');

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearch(term);
  };

  const onSelectionChange = (e) => {
    const selectedNode = e.value;
    if (selectedNode !== categoryId) {
      setCategoryId(selectedNode);
    }
    setSelectedNodeKey(selectedNode);
  };

  const updatedTree = (load = true) => {
    setCategoryId(undefined);
    if (load) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };

  const expandAll = () => {
    const _expandedKeys = {};
    for (const node of nodes) {
      expandNode(node, _expandedKeys);
    }
    setExpandedKeys(_expandedKeys);
  };

  const collapseAll = () => {
    setExpandedKeys({});
  };

  const expandNode = (node, _expandedKeys) => {
    if (node.children && node.children.length) {
      _expandedKeys[node.key] = true;
      for (const child of node.children) {
        expandNode(child, _expandedKeys);
      }
    }
  };

  const nodeTemplate = (node, options) => {
    return (
      <div className="d-flex align-items-center gap-2 border-bottom w-100">
        {node.imageUrl && (
          <img src={node.imageUrl} alt={node.label} width={50} height={50} />
        )}
        <span>{node.label}</span>
      </div>
    );
  };

  return (
    <Row className="justify-content-center">
      <Col md={'6'} className="p-2">
        <Input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="mb-3"
        />
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
          onDragDrop={(e) => setNodes(e.value)}
          expandedKeys={expandedKeys}
          onToggle={(e) => setExpandedKeys(e.value)}
        />
      </Col>
      <Col md={'6'} className="p-2">
        <UpdateItemRestaurantCategoryTree categoryId={categoryId} onSave={updatedTree} />
      </Col>
    </Row>
  );
};

export default ItemRestaurantCategoriesTree;
