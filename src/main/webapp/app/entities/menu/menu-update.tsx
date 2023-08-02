  import React, { useState, useEffect } from 'react';
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
  ModalHeader, Container, Nav, NavItem, NavLink, TabContent, TabPane
  } from 'reactstrap';
  import {isNumber, TextFormat, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

  import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
  import { mapIdList } from 'app/shared/util/entity-utils';
  import { useAppDispatch, useAppSelector } from 'app/config/store';

  import { ITerm } from 'app/shared/model/term.model';
  import { getEntities as getTerms } from 'app/entities/term/term.reducer';
  import { IMenu } from 'app/shared/model/menu.model';
  import {getEntity, updateEntity, createEntity, reset, sendEvent} from './menu.reducer';
  import {faTimes} from "@fortawesome/free-solid-svg-icons";
  import {getEntities as getItems , searchEntities as searchItems} from "app/entities/item/item.reducer";
  import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
  import Select from "react-select";
  import {APP_DATE_FORMAT} from "app/config/constants";


  export const MenuUpdate = () => {
    const dispatch = useAppDispatch();

    const navigate = useNavigate();

    const { id } = useParams<'id'>();
    const isNew = id === undefined;

    const terms = useAppSelector(state => state.term.entities).filter(term => term.taxonomy.name === 'Menu Category');
    const itemList = useAppSelector(state => state.item.entities);
    const menuEntity = useAppSelector(state => state.menu.entity);
    const loading = useAppSelector(state => state.menu.loading);
    const updating = useAppSelector(state => state.menu.updating);
    const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
    const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
    const initialBranches = menuEntity.branch?.map(branch => ({ value: branch.id, label: branch.name }));


    const [isModalOpen, setModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState();
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [displayedTerms, setDisplayedTerms] = useState([]);
    const [activeTerm, setActiveTerm] = useState(null);
    const [showEdit, setShowEdit] = useState(false)

    const [selectedBranches, setSelectedBranches] = useState([])


console.log(itemList, 'itemList')


    const handleAddItem = () => {
      if (selectedItems.length > 0) {
        setSelectedItems((prevItems) => [...prevItems, ...selectedItems]);
        setMenuItems((prevItems) => [...prevItems, ...selectedItems]);
      }
      setModalOpen(false);
      setSelectedItems([]);
    };




    const handleDeleteItem = (itemId) => {
      setSelectedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      setMenuItems((prevItems) => prevItems.filter((item) => item.id !== itemId && item.id !== null));
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

    const handleClose = () => {
      navigate('/menu' + location.search);
    };

    useEffect(() => {
      if (isNew) {
        dispatch(reset());
      } else {
        dispatch(getEntity(id));
        dispatch(getEntity(id));
      }
      dispatch(getBranches({}))
      dispatch(getTerms({}));
      dispatch(getItems({}));

    }, []);


    useEffect(() => {
      if (menuEntity?.item) {
        setMenuItems(menuEntity.item.map(item => item));
        setDisplayedTerms([...new Set(itemList?.map(item => item.terms[0]?.name || "uncategorized"))]
          .sort((a, b) => (a === 'uncategorized' ? 1 : b === 'uncategorized' ? -1 : 0)));

        if (displayedTerms.length > 0) {
          setActiveTab(displayedTerms[0]);
        }

        console.log(itemList, 'displayed terms');
      }

      if (menuEntity?.category){
        setSelectedCategory(menuEntity.category.name)
      }
      if (menuEntity?.branch){
        setSelectedBranches(menuEntity.branch?.map((branch) => ({id: branch.id})))
      }
        // if (updateSuccess) {
        //   handleClose();
        // }
    }, [updateSuccess, menuEntity?.item]);


    console.log(itemList, 'items')
    const saveEntity = (values) => {
      values.createdAt = convertDateTimeToServer(values.createdAt);
      values.updatedAt = convertDateTimeToServer(values.updatedAt);

      const { category, ...restValues } = values;

      const itemIds = selectedItems.filter((item) => item.id !== null).map((item) => ({ id: item.id }));

      const filteredMenuItems = menuItems.filter((item) => item.id !== null)

      console.log(selectedBranches, 'selectedBranches')


      const entity = {
        ...menuEntity,
        ...restValues,
        category: selectedCategory ? terms.find((it) => it.name === selectedCategory) : null,
        item: [...filteredMenuItems, ...itemIds],
        branch: selectedBranches
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
            createdAt: displayDefaultDateTime(),
            updatedAt: displayDefaultDateTime(),
          }
        : {
            ...menuEntity,
            createdAt: convertDateTimeFromServer(menuEntity.createdAt),
            updatedAt: convertDateTimeFromServer(menuEntity.updatedAt),
            category: selectedCategory
          };

    console.log(menuItems, 'menuItems')
    const filteredItemList = itemList.filter(item => !menuItems?.some(menuItem => menuItem.id === item.id && menuItem.id !== null));
    const allItemsPresent = () => {
      return filteredItemList.every((item) => menuItems.some((menuItem) => menuItem.id === item.id && menuItem.id !== null));
    };

    const handleBranchChange = (selectedBranches) => {
      console.log(selectedBranches, 'lol')
      setSelectedBranches(selectedBranches.map((branch) => ({id: branch.value})));
    }




    const groupedMenuItems = itemList.reduce((groups, item) => {
      const termName = item.terms[0]?.name || 'Uncategorized';
      if (!groups[termName]) {
        groups[termName] = [];
      }
      groups[termName].push(item);
      return groups;
    }, {});





    if (!menuEntity) {
      return <p>Loading...</p>;
    }

    return (
      <div>
        <Card >
          <CardBody>
            <h1>
             {menuEntity.name}
            </h1>
            <p>
              <Translate contentKey="tempApp.menu.createdAt">Created At</Translate>:{' '}
              {menuEntity.createdAt ? <TextFormat value={menuEntity.createdAt} type="date" format={APP_DATE_FORMAT} /> : null}
            </p>
            <p>
              <Translate contentKey="tempApp.menu.updatedAt">Updated At</Translate>:{' '}
              {menuEntity.updatedAt ? <TextFormat value={menuEntity.updatedAt} type="date" format={APP_DATE_FORMAT} /> : null}
            </p>
            <p>
              <Translate contentKey="tempApp.menu.category">Category</Translate>:{' '}
              {menuEntity.category ? menuEntity.category.name : ''}
            </p>
          </CardBody>
          <div className="d-flex gap-3">
          <Button color="primary" onClick={toggleEditModal}>
            <FontAwesomeIcon icon="pencil-alt" />{' '}
            <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
           </span>
          </Button>
            <Button onClick={() => dispatch(sendEvent(id))} className="btn-success flex-grow-0" style={{ fontFamily: 'fantasy' }}>
              Trigger
            </Button>
          </div>
        </Card>


        <Row className="justify-content-center">
          <Col md="8">

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
                <div className="mb-3">
                  Branches
                  <Select isMulti={true} defaultValue={initialBranches}
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
                  {terms
                    ? terms.map((otherEntity) => (
                      <option key={otherEntity.id} value={otherEntity.name}>
                        {otherEntity.name}
                      </option>
                    ))
                    : null}

                </ValidatedField>
                    <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/menu" replace color="info">
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
<Container>
                <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
                  <div className="text-end mt-4">
                <Button color="primary" onClick={toggleModal} disabled={allItemsPresent()}>
                  Add Item
                </Button>
                  </div>
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
                                          <p>{item.desc}</p>
                                          <p>{item.terms[0]?.name}</p>
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
                <Nav pills className="mt-5">
                  {displayedTerms.map((termName) => (
                    <NavItem key={termName}>
                      <NavLink
                        className={termName === activeTab ? 'active' : ''}
                        onClick={() => handleTabClick(termName)}
                      >
                        {termName}
                      </NavLink>
                    </NavItem>
                  ))}
                </Nav>
                <TabContent activeTab={activeTab}>
                  {displayedTerms.map((termName) => (
                    <TabPane key={termName} tabId={termName}>
                      <Row className="mt-4">
                        {menuItems
                          .filter(
                            (item) =>
                              item.terms[0]?.name === termName || (!item.terms[0]?.name && termName === 'uncategorized')
                          )
                          .map((item) => (
                            <Col key={item.id} md="4" className="mb-4">
                              <Card className="border border-1 rounded shadow-sm" >
                                <CardBody className="d-flex">
                                  <div className="d-flex align-items-center justify-content-center" style={{ flex: '1 0 33%', padding: '20 10px', height: '150px', width: '100%' }}>
                                    {item.attachments.length > 0 && (
                                      <img
                                        src={item.attachments[0].url}
                                        alt="Item Image"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    )}
                                  </div>
                                  <div style={{ flex: '1 0 67%', padding: '0 10px' }}>
                                    <h6 style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.name}</h6>
                                    <p>{item.desc}</p>
                                    <Button color="danger" onClick={() => handleDeleteItem(item.id)}>
                                      Remove
                                    </Button>
                                  </div>
                                </CardBody>
                              </Card>
                            </Col>
                          ))}
                      </Row>
                    </TabPane>
                  ))}
                </TabContent>
                  <div className="text-start ">

                    <Button  color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                      <FontAwesomeIcon icon="save" /> <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                  </div>

                </ValidatedForm>
                 </Container>
                <>
              </>
          </Col>
        </Row>
      </div>
    );
  };

  export default MenuUpdate;
