import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './pos-authority-group.reducer';
import { IPosAuthorityGroup, POSAuthorityEnum } from 'app/shared/model/pos-authority-group';
import Select from 'react-select';

export const PosAuthorityGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const posAuthorityGroupEntity: IPosAuthorityGroup = useAppSelector(state => state.posAuthorityGroup.entity);
  const loading = useAppSelector(state => state.posAuthorityGroup.loading);
  const updating = useAppSelector(state => state.posAuthorityGroup.updating);
  const updateSuccess = useAppSelector(state => state.posAuthorityGroup.updateSuccess);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    dispatch(changeEntityField({ name, value }))
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (isNew) {
        await dispatch(createEntity(posAuthorityGroupEntity));
      } else {
        await dispatch(updateEntity(posAuthorityGroupEntity));
      }

    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };

  const authorityOptions = Object.values(POSAuthorityEnum).map((authority) => ({
    value: authority,
    label: authority.replace('_', ' '), // Optionally format the label
  }));

  // Map current authorities to selected options
  const selectedOptions = authorityOptions.filter((option) =>
    posAuthorityGroupEntity?.authorities?.includes(option.value)
  );

  const handleChange = (selected) => {
    // `selected` is an array of selected options
    const selectedAuthorities = selected ? selected.map((opt) => opt.value) : [];
    dispatch(
      changeEntityField({
        name: 'authorities',
        value: selectedAuthorities,
      })
    );
  };

  return (
    <div>
      <div className="col-8">
        <h2>
          {isNew ? <Translate contentKey={'tempApp.pos-authority-group.home.createLabel'} /> : <Translate contentKey={'tempApp.pos-authority-group.home.editLabel'} />}
        </h2>
      </div>
      <div className="col-8">
        <div className="p-grid d-flex flex-column p-3  bg-white">

          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={handleSubmit}>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="name">
                <Translate contentKey={'tempApp.pos-authority-group.name'} />
              </label>
              <InputText
                id="name"
                name="name"
                value={posAuthorityGroupEntity?.name || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.pos-authority-group.name")}
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="description">
                <Translate contentKey={'tempApp.pos-authority-group.description'} />
              </label>
              <InputText
                id="description"
                name="description"
                value={posAuthorityGroupEntity?.description || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.pos-authority-group.description")}
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="authorities">
                <Translate contentKey={'tempApp.pos-authority-group.authorities'} />
              </label>
              <Select
                isMulti
                options={authorityOptions}
                value={selectedOptions}
                onChange={handleChange}
                placeholder="Select authorities"
              />
            </div>

            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/pos-authority-group')}
              >
                <Translate contentKey={'common.buttons.back'} />
              </Button>
              <Button
                id="save-entity"
                type="submit"
                disabled={updating}
                icon="pi pi-save"
              >
                <Translate contentKey={'common.buttons.save'} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PosAuthorityGroupUpdate;
