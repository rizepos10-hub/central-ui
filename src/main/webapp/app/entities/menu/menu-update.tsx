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
    ModalHeader
  } from 'reactstrap';
  import { isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

  import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
  import { mapIdList } from 'app/shared/util/entity-utils';
  import { useAppDispatch, useAppSelector } from 'app/config/store';

  import { ITerm } from 'app/shared/model/term.model';
  import { getEntities as getTerms } from 'app/entities/term/term.reducer';
  import { IMenu } from 'app/shared/model/menu.model';
  import { getEntity, updateEntity, createEntity, reset } from './menu.reducer';
  import {faTimes} from "@fortawesome/free-solid-svg-icons";
  import {getEntities as getItems , searchEntities as searchItems} from "app/entities/item/item.reducer";
  import MenuItem from "app/entities/menu/menu-item";




  export const MenuUpdate = () => {
    const dispatch = useAppDispatch();

    const navigate = useNavigate();

    const { id } = useParams<'id'>();
    const isNew = id === undefined;

    const terms = useAppSelector(state => state.term.entities).filter(term => term.taxonomy.name === 'menu category');
    const itemList = useAppSelector(state => state.item.entities);
    const menuEntity = useAppSelector(state => state.menu.entity);
    const loading = useAppSelector(state => state.menu.loading);
    const updating = useAppSelector(state => state.menu.updating);
    const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState();
    const [menuItems, setMenuItems] = useState([]);

    console.log(menuItems, 'menus')

console.log(selectedCategory, 'menaa')
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


    const toggleModal = () => {
      setModalOpen(!isModalOpen);
    };


    const handleClose = () => {
      navigate('/menu' + location.search);
    };

    useEffect(() => {
      if (isNew) {
        dispatch(reset());
      } else {
        dispatch(getEntity(id));
      }
      dispatch(getItems({}));
      dispatch(getEntity(id));
      dispatch(getTerms({}));

    }, []);


    useEffect(() => {
      if (menuEntity?.item) {
        setMenuItems(menuEntity.item.map(item => item));
      }
      if (menuEntity?.category){
        setSelectedCategory(menuEntity.category.name)
      }
      if (updateSuccess) {
        handleClose();
      }
    }, [updateSuccess, menuEntity?.item]);


    const saveEntity = (values) => {
      values.createdAt = convertDateTimeToServer(values.createdAt);
      values.updatedAt = convertDateTimeToServer(values.updatedAt);

      const { category, ...restValues } = values;

      const itemIds = selectedItems.filter((item) => item.id !== null).map((item) => ({ id: item.id }));

      const filteredMenuItems = menuItems.filter((item) => item.id !== null)



      const entity = {
        ...menuEntity,
        ...restValues,
        category: selectedCategory ? terms.find((it) => it.name === selectedCategory) : null,
        item: [...filteredMenuItems, ...itemIds],
      };

      console.log(entity, 'entitysent')

      if (isNew) {
        dispatch(createEntity(entity));
      } else {
        dispatch(updateEntity(entity));
      }
    };



    console.log(selectedCategory , 'hello world')
    console.log(menuEntity, 'hello world')



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

    console.log(menuItems)
    const filteredItemList = itemList.filter(item => !menuItems?.some(menuItem => menuItem.id === item.id && menuItem.id !== null));
    const allItemsPresent = () => {
      return filteredItemList.every((item) => menuItems.some((menuItem) => menuItem.id === item.id && menuItem.id !== null));
    };

    if (!menuEntity) {
      return <p>Loading...</p>;
    }

    return (
      <div>
        <Row className="justify-content-center">
          <Col md="8">
            <h2 id="tempApp.menu.home.createOrEditLabel" data-cy="MenuCreateUpdateHeading">
              <Translate contentKey="tempApp.menu.home.createOrEditLabel">Create or edit a Menu</Translate>
            </h2>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col md="8">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
                {!isNew ? (
                  <ValidatedField
                    name="id"
                    required
                    readOnly
                    id="menu-id"
                    label={translate('global.field.id')}
                    validate={{ required: true }}
                  />
                ) : null}
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
                  label={translate('tempApp.menu.createdAt')}
                  id="menu-createdAt"
                  name="createdAt"
                  data-cy="createdAt"
                  type="datetime-local"
                  placeholder="YYYY-MM-DD HH:mm"
                />
                <ValidatedField
                  label={translate('tempApp.menu.updatedAt')}
                  id="menu-updatedAt"
                  name="updatedAt"
                  data-cy="updatedAt"
                  type="datetime-local"
                  placeholder="YYYY-MM-DD HH:mm"
                />
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
                <Button color="primary" onClick={toggleModal} disabled={allItemsPresent()}>
                  Add Item
                </Button>
                <Modal isOpen={isModalOpen} toggle={toggleModal} className="modal- modal-lg">
                  <ModalHeader toggle={toggleModal}>Add New Item</ModalHeader>
                  <ModalBody>
                    <MenuItem />
                    <Row className="justify-content-center mt-4">
                      {/* Replace the itemList.map with filteredItemList.map to use the filtered list */}
                      {filteredItemList.map((item) => (
                        <Col key={item.id} sm="6" md="4" lg="3" className="mb-4">
                          <div
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (selectedItems?.some((selectedItem) => selectedItem.id === item.id)) {
                                setSelectedItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
                              } else {
                                setSelectedItems((prevItems) => [...prevItems, item]);
                              }
                            }}
                          >
                            <Card
                              className={`border-4 shadow-sm h-100 ${
                                selectedItems?.some((selectedItem) => selectedItem.id === item.id) ? 'border-primary bg-primary' : ''
                              }`}
                            >
                              <CardBody>
                                <h6>{item.name}</h6>
                                <p>{item.desc}</p>
                              </CardBody>
                            </Card>
                          </div>
                        </Col>
                      ))}
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


                {menuEntity && menuEntity.item && menuEntity.item.length > 0 && (
                  <Row className="justify-content-center container border border-dark mt-4">
                    {menuItems && menuItems.map((item) => (
                      <Col key={item.id} sm="6" md="4" lg="3" className="mb-4 mt-4">
                        <Card className="border-4 shadow-sm h-100">
                          <CardBody>
                            <h6>{item.name}</h6>
                            <p>{item.desc}</p>
                            <p>Order Count: {item.orderCount}</p>
                            <p>Average Rating: {item.avgRating}</p>
                            {/* Delete Button */}
                            <Button
                              color="link"
                              onClick={() => handleDeleteItem(item.id)}
                              className="position-absolute top-0 end-0 text-danger"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </Button>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
                <FormText>
                  <Translate contentKey="entity.validation.required">This field is required.</Translate>
                </FormText>
                <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/menu" replace color="info">
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
            )}
          </Col>
        </Row>

      </div>
    );
  };

  export default MenuUpdate;
