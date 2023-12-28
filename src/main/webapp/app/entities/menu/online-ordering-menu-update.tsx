
import React, {useState, useEffect, useRef} from 'react';
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
import {Button as PrimeButton, Button as deleteButton} from 'primereact/button';

import {getSortState, isNumber, TextFormat, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getTerms } from 'app/entities/term/Menu-Category/menu-category.reducer';
import { IMenu } from 'app/shared/model/menu.model';
import {getEntity, updateEntity, createEntity, reset, sendEvent, duplicateMenu} from './menu.reducer';
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {getEntities as getItems , searchEntities as searchItems} from "app/entities/item/restaurant/restaurant-item.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import Select from "react-select";
import {APP_DATE_FORMAT} from "app/config/constants";
import {DataView, DataViewLayoutOptions} from "primereact/dataview";
import {Dropdown, DropdownChangeEvent} from "primereact/dropdown";
import {InputText} from "primereact/inputtext";
import {Demo} from "app/shared/sidebar/types/demo";
import {Rating} from "primereact/rating";
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import {Skeleton} from "primereact/skeleton";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {toast} from "react-toastify";
import {OrderList} from "primereact/orderlist";


export const OnlineOrderingMenuUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const toastId = useRef(null);

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const menuCategories = useAppSelector(state => state.menuCategory.entities)
  const itemList = useAppSelector(state => state.restaurantItems.entities);
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const errorMessage = useAppSelector(state => state.menu.errorMessage);


  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = {label : menuEntity?.branch?.name , value: menuEntity?.branch?.id}





  console.log('initalBranches', initialBranches)

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


    if(updateSuccess){
      handleRefresh()
    }
    return () => {
      reset()
    }
  }, [refresh, selectedItems,navigate]);


  useEffect(() => {

    if (menuEntity?.item && !activeTab) {
      setMenuItems(menuEntity.item.map(item => item));
      setDisplayedTerms([...new Set(itemList?.map(item => item.categories?.[0]?.name || "Uncategorized"))]
        .sort((a, b) => (a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : 0)));
      setActiveTab(displayedTerms[0]);

    }


    if(updateSuccess){
      handleRefresh()
    }

    if (menuEntity?.category){
      setSelectedCategory(menuEntity.category.name)
    }
    if (menuEntity?.branch){
      setSelectedBranches({label: menuEntity?.branch?.name , value: menuEntity?.branch?.id})
    }
    console.log(menuEntity, 'menuEntity')
    onFilter();

    return () => {
      reset()
    }

  }, [updateSuccess, menuEntity?.item, displayedTerms,selectedTerm ]);



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
    console.log(values, 'lololo')
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
      category: selectedCategory ? menuCategories.find((it) => it.name === selectedCategory) : null,
      item: [...filteredMenuItems, ...itemIds],
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



  if(errorMessage) {
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

  const onFilter = () => {
    if (selectedTerm === '') {
      setFilteredValue(menuItems);
    } else {
      const filtered = menuItems?.filter((product) => {
        return product.menuCategories[0]?.name === selectedTerm;
      });
      setFilteredValue(filtered);
    }
  };



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

      <Button color="primary"  onClick={toggleModal} disabled={allItemsPresent()}>
        Add Item
      </Button>
      <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
    </div>
  );


  const dataviewListItem = (data: Demo.Product) => {
    return (
      <div className="col-12">
        <div className="flex flex-column md:flex-row align-items-center p-3 w-full">
          <img src={data?.attachments && data?.attachments[0]?.url} alt={data.name} className="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
          <div className="flex-1 flex flex-column align-items-center text-center md:text-left">
            <div className="font-bold text-2xl">{data.name}</div>
            <div className="mb-2">{data.description}</div>
            {/* <Rating value={data.rating} readOnly cancel={false} className="mb-2"></Rating> */}
            <div className="flex align-items-center">
              <i className="pi pi-tag mr-2"></i>
              <span className="font-semibold">{data.menuCategories[0]?.name || 'Uncategorized'}</span>
            </div>
          </div>
          <div className="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
            <span className="text-2xl font-semibold mb-2 align-self-center md:align-self-end">  ${getPriceForBranch(data) ?? data.variants[0]?.price}</span>

            {/* <Button icon="pi pi-shopping-cart" label="Add to Cart" disabled={data.inventoryStatus === 'OUTOFSTOCK'} className="mb-2 p-button-sm"></Button> */}
            {/* <span className={`product-badge status-${data.inventoryStatus?.toLowerCase()}`}>{data.inventoryStatus}</span> */}
          </div>
        </div>
      </div>
    );
  };


  const dataviewGridItem = (data: Demo.Product) => {
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

            to={`/item/${data.id}/edit?fromMenu`}
          >
            <div className="flex flex-column align-items-center text-center mb-3">
              <img  src={data?.attachments && data?.attachments[0]?.url} alt={data.name} className="w-9 shadow-2 my-3 mx-0" />

              <div className="text-2xl font-bold">{data.name}</div>
              <div className="mb-3">{data.description}</div>
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
        .then((result:any) => {
          console.log('Duplicate successful:', result);

          if (result?.payload?.id) {
            navigate(`/menu/${result.payload.id}/edit`);
          } else {
            console.error('Failed to duplicate menu: No ID returned');
          }

          setRefresh(prev => !prev);
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
      <Card>
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1>{menuEntity.name}</h1>
          <div>
            <Button color="primary" onClick={toggleEditModal}>
              <FontAwesomeIcon icon="pencil-alt" />{' '}
              <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
            </Button>
            <Button onClick={() => dispatch(sendEvent(id))} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              Trigger
            </Button>
            <Button onClick={handleDuplicateAction} className="btn-success ms-2" style={{ fontFamily: 'fantasy' }}>
              Duplicate Menu
            </Button>
          </div>
        </div>
        <CardBody>
          <p>
            <Translate contentKey="tempApp.menu.createdAt">Created At</Translate>:{' '}
            {menuEntity.createdDate ? <TextFormat value={menuEntity.createdDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.updatedAt">Updated At</Translate>:{' '}
            {menuEntity.lastModifiedDate ? <TextFormat value={menuEntity.lastModifiedDate} type="date" format={APP_DATE_FORMAT} /> : null}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.menuUrl">Menu URl</Translate>: {menuEntity.menuUrl ? menuEntity.menuUrl : ''}
          </p>
          <p>
            <Translate contentKey="tempApp.menu.category">Category</Translate>: {menuEntity.category ? menuEntity.category.name : ''}
          </p>
        </CardBody>
      </Card>


      <>
        <>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <Modal isOpen={isEditModalOpen} toggle={toggleEditModal} className="modal-lg">
              <ModalHeader toggle={toggleEditModal}>
                <Translate contentKey="tempApp.menu.home.createOrEditLabel">Create or edit a Menu</Translate>
              </ModalHeader>
              <ModalBody>
                <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

                  <ValidatedField
                    label={translate('tempApp.menu.name')}
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
                    label={translate('tempApp.menu.menuUrl')}
                    id="menu-menuUrl"
                    name="menuUrl"
                    data-cy="menuUrl"
                    type="text"

                  />
                  <div className="mb-3">
                    Branches
                    <Select defaultValue={initialBranches}
                            onChange={handleBranchChange} options={branchList} />
                  </div>
                  <ValidatedField
                    id="menu-category"
                    name="category"
                    data-cy="category"
                    label={translate('tempApp.menu.category')}
                    type="select"
                    required
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    {menuCategories
                      ? menuCategories.map((otherEntity) => (
                        <option key={otherEntity.id} value={otherEntity.name}>
                          {otherEntity.name}
                        </option>
                      ))
                      : null}

                  </ValidatedField>
                  <Button  id="cancel-save" data-cy="entityCreateCancelButton" onClick={toggleEditModal} replace color="info">
                    <FontAwesomeIcon icon="arrow-left"/>
                    &nbsp;
                    <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.back">Back</Translate>
                        </span>
                  </Button>
                  &nbsp;
                  <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                          disabled={updating}>
                    <FontAwesomeIcon icon="save"/>
                    &nbsp;
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                </ValidatedForm>

              </ModalBody>
              {!isNew && (
                <>
                  <br/>
                  <ModalFooter>

                  </ModalFooter>
                </>
              )}
            </Modal>)}
          <div>
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>

              <Modal isOpen={isModalOpen} toggle={toggleModal} className="modal- modal-lg">
                <ModalHeader toggle={toggleModal}>Add New Item</ModalHeader>
                <ModalBody>
                  <Row>
                    <Col md="3">
                      <ListGroup>
                        {Object.keys(groupedMenuItems).map((termName) => (
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
                              .filter((item) => !menuItems.some((menuItem) => menuItem.id === item.id && menuItem.id !== null))
                              .map((item) => (
                                <Col key={item.id} sm="6" md="4" lg="3" className="mb-4">
                                  <div
                                    style={{cursor: 'pointer'}}
                                    onClick={() => {
                                      if (selectedItems?.some((selectedItem) => selectedItem.id === item.id)) {
                                        setSelectedItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
                                      } else {
                                        setSelectedItems((prevItems) => [...prevItems, item]);
                                      }
                                    }}
                                  >
                                    <Card
                                      className={`border-4 shadow-sm h-100 ${selectedItems?.some((selectedItem) => selectedItem.id === item.id) ? 'border-primary bg-primary' : ''}`}
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
                        <p>Please select a term to view its items.</p>
                      )}
                    </Col>
                  </Row>
                </ModalBody>
                <ModalFooter>
                  <Button color="secondary" onClick={toggleModal}>
                    Cancel
                  </Button>
                  <Button color="primary" onClick={handleAddItem}>
                    Add Item
                  </Button>
                </ModalFooter>
              </Modal>

              <div className="col-12">
                <div className="card">
                  <h5>Menu Items View</h5>
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

                <Button  color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" /> <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>

            </ValidatedForm>
          </div>
          <>
          </>
        </>
      </>
    </div>
  );
};

export default OnlineOrderingMenuUpdate;
