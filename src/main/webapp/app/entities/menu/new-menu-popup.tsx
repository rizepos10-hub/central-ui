import React, {useEffect, useState} from "react"
import {Button, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import {translate, Translate, ValidatedField, ValidatedForm} from "react-jhipster";
import Select from "react-select";
import {Link, useNavigate, useParams} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {createEntity, getEntity, reset, updateEntity} from "app/entities/menu/menu.reducer";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {getEntities as getTerms, getMenuCategories} from "app/entities/term/term.reducer";
import {getEntities as getItems} from "app/entities/item/item.reducer";
import {convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime} from "app/shared/util/date-utils";
import {result} from "lodash";


const NewMenuPopup = () => {


  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const terms = useAppSelector(state => state.term.entities)
  const itemList = useAppSelector(state => state.item.entities);
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const newMenu = useAppSelector(state => state.menu.entity)
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = menuEntity.branch?.map(branch => ({ value: branch.id, label: branch.name }));


  const [selectedCategory, setSelectedCategory] = useState();
  const [menuItems, setMenuItems] = useState([]);


  const [selectedBranches, setSelectedBranches] = useState([])








  const handleCategoryChange = (event) => {
    console.log(event.target.value, 'change')
    setSelectedCategory(event.target.value);
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
    dispatch(getMenuCategories({}));
    dispatch(getItems({}));

  }, []);


  useEffect(() => {

    const {id: newMenuId} = newMenu
    if (updateSuccess && newMenuId) {
      navigate(`/menu/${newMenuId}/edit?page=1&sort=id,asc`)
    }
  }, [newMenu]);

  console.log(terms, 'termos')

  const saveEntity = (values) => {
    values.createdAt = convertDateTimeToServer(values.createdAt);
    values.updatedAt = convertDateTimeToServer(values.updatedAt);

    const { category, ...restValues } = values;



    const entity = {
      ...menuEntity,
      ...restValues,
      category: selectedCategory ? terms.find((it) => it.name === selectedCategory) : null,
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
    isNew ? {
        createdAt: displayDefaultDateTime(),
        updatedAt: displayDefaultDateTime(),
      }
      : {
        ...menuEntity,
        createdAt: convertDateTimeFromServer(menuEntity.createdAt),
        updatedAt: convertDateTimeFromServer(menuEntity.updatedAt),
        category: selectedCategory
      };



  const handleBranchChange = (selectedBranches) => {
    console.log(selectedBranches, 'lol')
    setSelectedBranches(selectedBranches.map((branch) => ({id: branch.value})));
  }







  return (
    <Modal isOpen={true} toggle={handleClose} className="modal-lg">
      <ModalHeader toggle={handleClose}>
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
            label={translate("tempApp.menu.category")}
            type="select"
            required
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value=""></option>
            {terms ? (
              terms.map((otherEntity) => (
                <option key={otherEntity.id} value={otherEntity.name}>
                  {otherEntity.name}
                </option>
              ))
            ) : (
              <option value={null}>No categories found</option>
            )}
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

    </Modal>
  )
}
export default NewMenuPopup
