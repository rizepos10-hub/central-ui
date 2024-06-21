
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';


import {
  Button,
  Row,
  Col,
  FormText,
  Card,
  ListGroup,
  ListGroupItem,
  CardBody,
  Modal,
  ModalFooter,
  ModalBody,
  ModalHeader, Container, Nav, NavItem, NavLink, TabContent, TabPane, Alert
} from 'reactstrap';
import { Button as PrimeButton, Button as deleteButton } from 'primereact/button';

import { getSortState, isNumber, TextFormat, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { mapIdList, overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getTerms } from 'app/entities/term/Menu-Category/menu-category.reducer';
import { IMenu } from 'app/shared/model/menu.model';
import { getEntity, updateEntity, createEntity, reset, sendEvent, duplicateMenu } from './menu.reducer';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { getEntities as getItems } from "app/entities/item/all-items.reducer";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import Select from "react-select";
import { APP_DATE_FORMAT } from "app/config/constants";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Demo } from "app/shared/sidebar/types/demo";
import { Rating } from "primereact/rating";
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { Skeleton } from "primereact/skeleton";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { toast } from "react-toastify";
import { OrderList } from "primereact/orderlist";
import { ItemRoute } from "app/shared/model/ENUMS/item-route.model";
import { IItem } from "app/shared/model/ITEM/item.model";
import ImageDisplay from "app/shared/components/image/image-display";
import { SelectButton } from "primereact/selectbutton";


export const OnlineOrderingMenuUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const toastId = useRef(null);

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const menuCategories = useAppSelector(state => state.menuCategory.entities)
  const itemList = useAppSelector(state => state.allItems.entities);
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const errorMessage = useAppSelector(state => state.menu.errorMessage);


  const ITEM_TYPE_OPTIONS = ["RETAIL", "RESTAURANT"];
  const [itemType, setItemType] = useState<"RETAIL" | "RESTAURANT">("RETAIL")
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = { label: menuEntity?.branch?.name, value: menuEntity?.branch?.id }







  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [menuItems, setMenuItems] = useState([]);
  const [displayedTerms, setDisplayedTerms] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [activeTab, setActiveTab] = useState(displayedTerms.length > 0 ? displayedTerms[0] : null);
  const [refresh, setRefresh] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<any>();

  const [filteredValue, setFilteredValue] = useState<any>();
  const [layout, setLayout] = useState<'grid' | 'list' | (string & Record<string, unknown>)>('grid');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState<0 | 1 | -1 | null>(null);
  const [sortField, setSortField] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  console.log(menuItems, 'menuItems')

  const termOptions = [
    { label: 'All', value: '' },
    ...displayedTerms.map((term) => ({ label: term, value: term })),
  ];

  console.log(itemList, 'itemList1')


  const handleAddItem = () => {
    if (selectedItems.length > 0) {
      setSelectedItems((prevItems) => [...prevItems, ...selectedItems]);
      setMenuItems((prevItems) => [...prevItems, ...selectedItems]);
    }
    setModalOpen(false);
    setSelectedItems([]);
  };




  // const handleDeleteItem = (itemId) => {
  //   const confirmed = window.confirm('Are you sure you want to remove this item?');
  //   if (confirmed) {
  //     setSelectedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  //     setMenuItems((prevItems) => prevItems.filter((item) => item.id !== itemId && item.id !== null));
  //   }
  // };

  const handleDeleteItem = (itemId) => {

    if (toast.isActive(toastId.current)) {
      return;
    }
    toastId.current = toast.info(
      <div>
        <span>Are you sure you want to remove this item?</span>
        <div className="d-flex mt-2 h-2rem">
          <PrimeButton
            label="Yes"
            onClick={() => {
              setSelectedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
              setMenuItems((prevItems) => prevItems.filter((item) => item.id !== itemId && item.id !== null));
              toast.dismiss(toastId.current);

            }}
            className="p-button-sm"
          />

          <PrimeButton
            label="No"
            className="p-button-secondary p-button-sm ms-2"
            onClick={() => {
              toast.dismiss(toastId.current);
            }}
          />
        </div>
      </div>,
      {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,

      }
    );
  };



  const handleCategoryChange = (event) => {
    console.log(event.target.value, 'change')
    setSelectedCategory(event.target.value);
  };


  const handleTabClick = (termName) => {
    setActiveTab(termName);
  };


  const toggleModal = () => {
    setModalOpen(!isModalOpen);
    setActiveTerm(null);
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  const handleRefresh = () => {
    setRefresh(prev => !prev)
  };

  const onFilter = () => {
    if (selectedTerm === '') {
      setFilteredValue(menuItems);
    } else {
      const filtered = menuItems?.filter((product) => {
        return product.categories[0]?.name === selectedTerm;
      });
      setFilteredValue(filtered);
    }
  };


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getTerms({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getItems({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));


    if (updateSuccess) {
      handleRefresh()
    }
    return () => {
      dispatch(reset())
    }
  }, [refresh, selectedItems, navigate]);




  useEffect(() => {

    if (menuEntity?.item && !activeTab) {
      setMenuItems(menuEntity.item.map(item => item));
      setDisplayedTerms([...new Set(itemList?.map(item => item.categories?.[0]?.name || "Uncategorized"))]
        .sort((a, b) => (a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : 0)));
      setActiveTab(displayedTerms[0]);

    }


    if (updateSuccess) {
      handleRefresh()
    }

    if (menuEntity?.category) {
      setSelectedCategory(menuEntity.category.name)
    }

    if (menuEntity?.itemType) {
      setItemType(menuEntity.itemType)
    }
    if (menuEntity?.branch) {
      setSelectedBranches({ label: menuEntity?.branch?.name, value: menuEntity?.branch?.id })
    }

    onFilter();

    return () => {
      reset()
    }

  }, [updateSuccess, menuEntity?.item, displayedTerms, selectedTerm]);



  function getPriceForBranch(data) {
    const branchId = menuEntity?.branch?.id;

    let foundPrice = null;

    data.variants?.forEach(variant => {
      const branchVariantDetails = variant.branchVariantDetails;

      if (branchVariantDetails && branchVariantDetails[branchId]) {
        foundPrice = branchVariantDetails[branchId].price;
      }
    });

    return foundPrice;
  }




  const saveEntity = (values) => {
    values.createdDate = convertDateTimeToServer(values.createdDate);
    values.lastModifiedDate = convertDateTimeToServer(values.lastModifiedDate);
    setIsEditModalOpen(false)

    const { category, ...restValues } = values;

    const itemIds = selectedItems.filter((item) => item.id !== null).map((item) => ({ id: item.id }));

    const filteredMenuItems = menuItems.filter((item) => item.id !== null)

    console.log(selectedBranches, 'selectedBranches')


    const entity = {
      ...menuEntity,
      ...restValues,
      itemType,
      category: selectedCategory ? menuCategories.find((it) => it.name === selectedCategory) : null,
      item: [...filteredMenuItems, ...itemIds].map(item => ({ id: item.id })),
      branch: { id: selectedBranches.value }
    };

    console.log(entity, 'entitysent')

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }

  };

  const defaultValues = () =>
    isNew
      ? {
        createdDate: displayDefaultDateTime(),
        lastModifiedDate: displayDefaultDateTime(),
      }
      : {
        ...menuEntity,
        createdDate: convertDateTimeFromServer(menuEntity.createdDate),
        lastModifiedDate: convertDateTimeFromServer(menuEntity.lastModifiedDate),
        category: selectedCategory
      };

  const filteredItemList = itemList.filter(item => !menuItems?.some(menuItem => menuItem.id === item.id && menuItem.id !== null));
  const allItemsPresent = () => {
    return filteredItemList.every((item) => menuItems.some((menuItem) => menuItem.id === item.id && menuItem.id !== null));
  };


  console.log(filteredItemList, 'filteredItemList')

  const handleBranchChange = (selectedBranches) => {
    console.log(selectedBranches, 'lol branch')
    setSelectedBranches(selectedBranches);
  }




  const groupedMenuItems = itemList.reduce((groups, item) => {
    const termName = item?.categories?.[0]?.name || 'Uncategorized';
    if (!groups[termName]) {
      groups[termName] = [];
    }
    groups[termName].push(item);
    return groups;
  }, {});



  if (errorMessage) {
    return (
      <Alert color="warning" className="mt-4">
        {errorMessage}
      </Alert>
    )
  }

  if (!menuEntity) {
    return <p>Loading...</p>;
  }




  const sortOptions = [
    { label: 'Price High to Low', value: '!price' },
    { label: 'Price Low to High', value: 'price' }
  ];




  console.log(menuItems, 'menu')

  const onSortChange = (event: DropdownChangeEvent) => {
    const value = event.value;

    if (value.indexOf('!') === 0) {
      setSortOrder(-1);
      setSortField(value.substring(1, value.length));
      setSortKey(value);
    } else {
      setSortOrder(1);
      setSortField(value);
      setSortKey(value);
    }
  };

  const dataViewHeader = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2">
      <Dropdown
        value={selectedTerm}
        options={termOptions}
        optionLabel="label"
        placeholder="Select Term"
        onChange={(e) => setSelectedTerm(e.value)}
      />

      <Button color="primary" onClick={toggleModal} disabled={allItemsPresent()}>
        Add Item
      </Button>
      <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
    </div>
  );


  const dataviewListItem = (data: IItem) => {
    return (
      <div className="col-12">
        <div className="flex flex-column md:flex-row align-items-center p-3 w-full">
          {data?.attachments && data?.attachments?.[0]?.url || data?.variants?.[0]?.attachments?.[0]?.url ?
            <img src={data?.attachments && data?.attachments?.[0]?.url || data?.variants?.[0]?.attachments?.[0]?.url}
              alt={data.name}
              className="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
            : null}
          <div className="flex-1 flex flex-column align-items-center text-center md:text-left">
            <div className="font-bold text-2xl">{data.name}</div>
            <div className="mb-2">{data.desc}</div>
            {/* <Rating value={data.rating} readOnly cancel={false} className="mb-2"></Rating> */}
            <div className="flex align-items-center">
              <i className="pi pi-tag mr-2"></i>
              <span className="font-semibold">{data.categories?.[0]?.name || 'Uncategorized'}</span>
            </div>
          </div>
          <div className="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
            <span className="text-2xl font-semibold mb-2 align-self-center md:align-self-end">  ${getPriceForBranch(data) ?? data.variants?.[0]?.price}</span>

            {/* <Button icon="pi pi-shopping-cart" label="Add to Cart" disabled={data.inventoryStatus === 'OUTOFSTOCK'} className="mb-2 p-button-sm"></Button> */}
            {/* <span className={`product-badge status-${data.inventoryStatus?.toLowerCase()}`}>{data.inventoryStatus}</span> */}
          </div>
        </div>
      </div>
    );
  };


  const dataviewGridItem = (data: IItem) => {
    return (
      <div className="col-12 lg:col-4">
        <div className="card m-3 border-1 surface-border">
          <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
            <div className="flex align-items-center">
              <i className="pi pi-tag mr-2" />
              <span className="font-semibold">{data.categories?.[0]?.name || 'Uncategorized'}</span>
            </div>
            {/* <span className={`product-badge status-${data.inventoryStatus?.toLowerCase()}`}>{data.inventoryStatus}</span> */}
          </div>
          <Link
            to={`/${ItemRoute[data.itemVariantType]}/${data.id}/edit?fromMenu=${menuEntity?.id}`}
          >
            <div className="flex flex-column align-items-center text-center mb-3">

              {/* <img src={data?.attachments && data?.attachments?.[0]?.url || data?.variants?.[0]?.attachments?.[0]?.url} */}
              {/*      alt={data.name} */}
              {/*      className="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5"/> */}
              <ImageDisplay
                imageType={"product"}
                imageUrl={data?.attachments?.[0]?.url || data?.variants?.[0]?.attachments?.[0]?.url}
                className={"my-4 md:my-0 w-9 md:w-10rem rounded"}
                height={100}
                width={100}
              />
              <div className="text-2xl font-bold">{data.name}</div>
              <div className="mb-3">{data.desc || "no description"}</div>
              {/* <Rating value={data.rating} readOnly cancel={false} /> */}
            </div>
          </Link>

          <div className="flex align-items-center justify-content-between">
            <span className="text-2xl font-semibold">${getPriceForBranch(data) ?? data.variants[0]?.price}</span>
            <Button color="danger" onClick={() => handleDeleteItem(data.id)}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const itemTemplate = (data: Demo.Product, layout: 'grid' | 'list' | (string & Record<string, unknown>)) => {
    if (!data) {
      return;
    }

    if (layout === 'list') {
      return dataviewListItem(data);
    } else if (layout === 'grid') {
      return dataviewGridItem(data);
    }
  };

  const handleDuplicateAction = () => {
    const isConfirmed = window.confirm('Are you sure you want to duplicate this menu?');

    if (isConfirmed) {
      dispatch(duplicateMenu(id))
        .then((result: any) => {
          if (result?.payload?.id) {
            navigate(`/menu/${result?.payload?.id}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
          } else {
            console.error('Failed to duplicate menu: No ID returned');
          }
          // setRefresh(prev => !prev);
        })
        .catch(error => {
          console.error('Error duplicating menu:', error);
        });
    }
  };



  const listItem = () => {
    return (
      <div className="col-12">
        <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
          <Skeleton className="w-9 sm:w-16rem xl:w-10rem shadow-2 h-6rem block xl:block mx-auto border-round" />
          <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
            <div className="flex flex-column align-items-center sm:align-items-start gap-3">
              <Skeleton className="w-8rem border-round h-2rem" />
              <Skeleton className="w-6rem border-round h-1rem" />
              <div className="flex align-items-center gap-3">
                <Skeleton className="w-6rem border-round h-1rem" />
                <Skeleton className="w-3rem border-round h-1rem" />
              </div>
            </div>
            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
              <Skeleton className="w-4rem border-round h-2rem" />
              <Skeleton shape="circle" className="w-3rem h-3rem" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{menuEntity.name}</h1>
          <div>
            <Button color="primary" onClick={toggleEditModal}>
              <FontAwesomeIcon icon="pencil-alt" />{' '}
              <span className="d-none d-md-inline">
                <Translate contentKey="menus.shared.update.edit.buttons.edit">Edit</Translate>
              </span>
            </Button>
            <Button onClick={() => dispatch(sendEvent(id))} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              <Translate contentKey="menus.shared.update.edit.buttons.trigger">Trigger</Translate>
            </Button>
            <Button onClick={handleDuplicateAction} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              <Translate contentKey="menus.shared.update.edit.buttons.duplicate">Duplicate Menu</Translate>
            </Button>
          </div>
        </div>
        <CardBody>
          <p>
            <Translate contentKey="menus.shared.update.edit.createdAt">Created At</Translate>:{' '}
            {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.edit.updatedAt">Updated At</Translate>:{' '}
            {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>Layout: {menuEntity.itemType ? menuEntity.itemType : ''}</p>
          <p>
            <Translate contentKey="menus.shared.update.edit.url">Menu URl</Translate>: {menuEntity.menuUrl ? menuEntity.menuUrl : ''}
          </p>
          <p>
            <Translate contentKey="menus.shared.update.category">Category</Translate>: {menuEntity.category ? menuEntity.category.name : ''}
          </p>
        </CardBody>
      </Card> */}
      <Modal isOpen={isEditModalOpen} toggle={toggleEditModal} className="modal-lg">
        <ModalHeader toggle={toggleEditModal}>
          <Translate contentKey="menus.shared.update.edit.title">Edit Menu</Translate>
        </ModalHeader>
        <ModalBody>
          <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
            <ValidatedField
              label={translate('menus.shared.update.name')}
              id="menu-name"
              name="name"
              data-cy="name"
              type="text"
              validate={{
                required: { value: true, message: translate('entity.validation.required') },
                maxLength: { value: 100, message: translate('entity.validation.maxlength', { max: 100 }) },
              }}
            />
            <ValidatedField
              label={translate('menus.shared.update.url')}
              id="menu-menuUrl"
              name="menuUrl"
              data-cy="menuUrl"
              type="text"
            />
            <div className="mb-3">
              {translate('menus.shared.update.branches')}
              <Select defaultValue={initialBranches} onChange={handleBranchChange} options={branchList} />
            </div>
            <div className="my-3">
              Layout
              <SelectButton value={itemType} onChange={e => setItemType(e.value)} options={ITEM_TYPE_OPTIONS} />
            </div>
            <ValidatedField
              id="menu-category"
              name="category"
              data-cy="category"
              label={translate('menus.shared.update.category')}
              type="select"
              value={selectedCategory || ''}
              onChange={handleCategoryChange}
            >
              <option value=""></option>
              {menuCategories
                ? menuCategories.map(otherEntity => (
                  <option key={otherEntity.id} value={otherEntity.name}>
                    {otherEntity.name}
                  </option>
                ))
                : null}
            </ValidatedField>
            <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={toggleEditModal} replace color="info">
              <FontAwesomeIcon icon="arrow-left" />
              &nbsp;
              <span className="d-none d-md-inline">
                <Translate contentKey="entity.action.back">Back</Translate>
              </span>
            </Button>
            &nbsp;
            <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
              <FontAwesomeIcon icon="save" />
              &nbsp;
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </ValidatedForm>
        </ModalBody>
        {!isNew && (
          <>
            <br />
            <ModalFooter></ModalFooter>
          </>
        )}
      </Modal>
      <Modal isOpen={isModalOpen} toggle={toggleModal} className="modal- modal-lg">
        <ModalHeader toggle={toggleModal}>
          <Translate contentKey={'menus.online.update.addItemModal.title'}>Add New Item</Translate>
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md="3">
              <ListGroup>
                {Object.keys(groupedMenuItems).map(termName => (
                  <ListGroupItem
                    key={termName}
                    tag="button"
                    action
                    onClick={() => setActiveTerm(termName)}
                    active={termName === activeTerm}
                  >
                    {termName}
                  </ListGroupItem>
                ))}
              </ListGroup>
            </Col>
            <Col md="9">
              {activeTerm ? (
                <>
                  <h3>{activeTerm}</h3>
                  <Row className="justify-content-center mt-4">
                    {groupedMenuItems[activeTerm]
                      .filter(item => !menuItems.some(menuItem => menuItem.id === item.id && menuItem.id !== null))
                      .map(item => (
                        <Col key={item.id} sm="6" md="4" lg="3" className="mb-4">
                          <div
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (selectedItems?.some(selectedItem => selectedItem.id === item.id)) {
                                setSelectedItems(prevItems => prevItems.filter(i => i.id !== item.id));
                              } else {
                                setSelectedItems(prevItems => [...prevItems, item]);
                              }
                            }}
                          >
                            <Card
                              className={`border-4 shadow-sm h-100 ${selectedItems?.some(selectedItem => selectedItem.id === item.id) ? 'border-primary bg-primary' : ''
                                }`}
                            >
                              <CardBody>
                                <h6>{item.name}</h6>
                                {/* <p>{item.desc}</p> */}
                                <p>{item.categories?.[0]?.name}</p>
                              </CardBody>
                            </Card>
                          </div>
                        </Col>
                      ))}
                  </Row>
                </>
              ) : (
                <p>
                  <Translate contentKey={'menus.online.update.addItemModal.message'}>
                    Please select a term to view its items.
                  </Translate>
                </p>
              )}
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>
            <Translate contentKey={'entity.action.cancel'}>Cancel</Translate>
          </Button>
          <Button color="primary" onClick={handleAddItem}>
            <Translate contentKey={'menus.online.update.addItemModal.addItem'}>Add Item</Translate>
          </Button>
        </ModalFooter>
      </Modal>
      {/* {loading ? (
            <p>Loading...</p>
          ) : (
          )} */}
      {/* <div>
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              <div className="col-12">
                <div className="card">
                  <h5>
                    <Translate contentKey={'menus.online.update.title'}>Menu Items View</Translate>
                  </h5>
                  <DataView
                    value={filteredValue ?? menuItems}
                    layout={layout}
                    paginator
                    rows={9}
                    loading={loading}
                    sortOrder={sortOrder}
                    sortField={sortField}
                    itemTemplate={itemTemplate}
                    header={dataViewHeader}
                  />
                </div>
              </div>
              <div className="text-start ">
                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" /> <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>
            </ValidatedForm>
          </div> */}
      <div className="">
        <div className="card p-1">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <h1 className="fs-3 fw-bold">John Doe</h1>
              <p className="text-muted">Admin</p>
            </div>
            <div className="mt-3 mt-md-0 d-flex gap-2">
              <PrimeButton label="Edit" className="p-button-outlined" />
              <PrimeButton label="Trigger" />
              <PrimeButton label="Duplicate" className="p-button-secondary" />
            </div>
          </div>
          <hr />
          <div className="row g-3 p-1">
            <div className="col-3">
              <p className="text-muted">Created At</p>
              <p className="fw-semibold">06/01/2024 14:03</p>
            </div>
            <div className="col-3">
              <p className="text-muted">Updated At</p>
              <p className="fw-semibold">13/06/2024 15:20</p>
            </div>
            <div className="col-3">
              <p className="text-muted">Layout</p>
              <p className="fw-semibold">RETAIL</p>
            </div>
            <div className="col-3">
              <p className="text-muted">Menu URL</p>
              <p className="fw-semibold">32</p>
            </div>
          </div>
        </div>
        <div className='card p-0'>
          <div className="card mb-4 p-1">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="fs-3 fw-bold">Menu Items View</h2>
              <div className="d-flex align-items-center gap-2">
                <Dropdown value={selectedCategory} options={[]} onChange={(e) => setSelectedCategory(e.value)} placeholder="Select a Category" />
                <PrimeButton label="Add Item" />
                <i className="pi pi-list p-button-outlined" />
                <i className="pi pi-th-large p-button-outlined" />
                {/* <PrimeButton className="p-button-outlined" icon="pi pi-th-large" size='small'/> */}
              </div>
            </div>
          </div>
          <div className="row g-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div className="col-3 d-flex justify-content-center container mt-5" key={index}>
                <div className="card p-3 bg-white"><i className="fa fa-apple"></i>
                  <div className="about-product text-center mt-2">
                    <img src="https://i.imgur.com/3VTaSeb.png" width="300" />
                    <div>
                      <h4>Believing is seeing</h4>
                      <h6 className="mt-0 text-black-50">Apple pro display XDR</h6>
                    </div>
                  </div>
                  <div className="stats mt-2">
                    <div className="d-flex justify-content-between p-price"><span>Pro Display XDR</span><span>$5,999</span></div>
                    <div className="d-flex justify-content-between p-price"><span>Pro stand</span><span>$999</span></div>
                    <div className="d-flex justify-content-between p-price"><span>Vesa Mount Adapter</span><span>$199</span></div>
                  </div>
                  <div className="d-flex justify-content-between total font-weight-bold mt-4"><span>Total</span><span>$7,197.00</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-center p-1">
            <PrimeButton label="Save" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineOrderingMenuUpdate;
