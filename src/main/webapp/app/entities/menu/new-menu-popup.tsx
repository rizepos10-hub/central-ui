import React, { useEffect, useState } from 'react';
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { translate, Translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import Select from 'react-select';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, getEntity, reset, updateEntity } from 'app/entities/menu/menu.reducer';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getMenuCategories } from 'app/entities/term/term.reducer';
import { convertDateTimeFromServer, convertDateTimeToServer, displayDefaultDateTime } from 'app/shared/util/date-utils';
import { MenuTypeModel } from 'app/shared/model/ENUMS/menu-type.model';

const NewMenuPopup = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const params = new URLSearchParams(location.search);
  const menuType = params.get('type');

  const terms = useAppSelector(state => state.term.entities);
  const menuEntity = useAppSelector(state => state.menu.entity);
  const loading = useAppSelector(state => state.menu.loading);
  const updating = useAppSelector(state => state.menu.updating);
  const updateSuccess = useAppSelector(state => state.menu.updateSuccess);
  const newMenu = useAppSelector(state => state.menu.entity);
  const branchList = useAppSelector(state => state.branch.entities).map(branch => ({ value: branch.id, label: branch.name }));
  const initialBranches = { label: menuEntity?.branch?.name, value: menuEntity?.branch?.id };
  const initialType = { label: menuEntity?.type, value: menuEntity?.type };

  const menuTypeOptions = Object.values(MenuTypeModel).map(type => ({ label: type, value: type }));
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedBranches, setSelectedBranches] = useState<{ value: string; label: string } | undefined>();
  const [selectedType, setSelectedType] = useState<{ value: string; label: string } | undefined>();

  const handleCategoryChange = event => {
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
    dispatch(getBranches({}));
    dispatch(getMenuCategories({}));
  }, []);

  useEffect(() => {
    const { id: newMenuId } = newMenu;
    const newMenuType = selectedType;
    if (updateSuccess && newMenuId) {
      navigate(`/menu/${newMenuId}/${newMenuType}/edit?page=1&sort=id,asc`);
    }
  }, [newMenu, updateSuccess]);

  console.log(terms, 'termos');

  console.log(newMenu, 'newMenu');

  const saveEntity = values => {
    values.createdDate = convertDateTimeToServer(values.createdDate);
    values.lastModifiedDate = convertDateTimeToServer(values.lastModifiedDate);

    const { category, ...restValues } = values;

    const entity = {
      ...menuEntity,
      ...restValues,
      // category: selectedCategory ? terms.find((it) => it.name === selectedCategory) : null,
      branch: { id: selectedBranches.value },
      type: selectedType,
    };

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
          category: selectedCategory,
        };

  const handleBranchChange = selectedBranches => {
    console.log(selectedBranches, 'lol branch');
    setSelectedBranches(selectedBranches);
  };

  const handleTypeChange = selectedType => {
    setSelectedType(selectedType?.value);
  };

  return (
    <Modal isOpen={true} toggle={handleClose} className="modal-lg">
      <ModalHeader toggle={handleClose}>
        <Translate contentKey="menus.shared.update.create.title">Create New Menu</Translate>
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
          <ValidatedField label={translate('menus.shared.update.url')} id="menu-menuUrl" name="menuUrl" data-cy="menuUrl" type="text" />
          <div className="mb-3">
            {translate('menus.shared.update.branches')}
            <Select defaultValue={initialBranches} onChange={handleBranchChange} options={branchList} />
          </div>
          <div className="mb-3">
            {translate('menus.shared.update.type')}
            <Select defaultValue={initialType} onChange={handleTypeChange} options={menuTypeOptions} />
          </div>
          <ValidatedField
            id="menu-category"
            name="category"
            data-cy="category"
            label={translate('menus.shared.update.category')}
            type="select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value=""></option>
            {terms ? (
              terms.map(otherEntity => (
                <option key={otherEntity.id} value={otherEntity.name}>
                  {otherEntity.name}
                </option>
              ))
            ) : (
              <option value={null}>No categories found</option>
            )}
          </ValidatedField>
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
      </ModalBody>
    </Modal>
  );
};
export default NewMenuPopup;
