import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './course-definition.reducer';
import { ICourseDefinition } from 'app/shared/model/COURSE-DEFINITION/course-definition';
import { InputNumber } from 'primereact/inputnumber';

export const CourseDefinitionUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const courseDefinitionEntity: ICourseDefinition = useAppSelector(state => state.courseDefinition.entity);
  const loading = useAppSelector(state => state.courseDefinition.loading);
  const updating = useAppSelector(state => state.courseDefinition.updating);
  const updateSuccess = useAppSelector(state => state.courseDefinition.updateSuccess);

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
        await dispatch(createEntity(courseDefinitionEntity));
      } else {
        await dispatch(updateEntity(courseDefinitionEntity));
      }

    } catch (error) {
      console.error('Error occurred while submitting:', error);
    }
  };

  return (
    <div>
      <div className="col-8">
        <h2>
          {isNew ? <Translate contentKey={'tempApp.course.home.createLabel'} /> : <Translate contentKey={'tempApp.course.home.editLabel'} />}
        </h2>
      </div>
      <div className="col-8">
        <div className="p-grid d-flex flex-column p-3  bg-white">

          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={handleSubmit}>

            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="name">
                <Translate contentKey={'tempApp.course.name'} />
              </label>
              <InputText
                id="name"
                name="name"
                value={courseDefinitionEntity?.name || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.course.name")}
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="description">
                <Translate contentKey={'tempApp.course.description'} />
              </label>
              <InputText
                id="description"
                name="description"
                value={courseDefinitionEntity?.description || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.course.description")}
              />
            </div>
            <div className="p-field d-flex flex-column mb-3">
              <label htmlFor="order">
                <Translate contentKey={'tempApp.course.order'} />
              </label>
              <InputNumber
                id="order"
                name="order"
                value={courseDefinitionEntity?.order}
                onChange={(e) => {
                  dispatch(changeEntityField({
                    name: "order",
                    value: e.value
                  }));
                }}
                required
                placeholder={translate("tempApp.course.order")}
              />
            </div>

            <div className="p-field d-flex gap-2 align-items-center mb-3">
              <Button
                id="cancel-save"
                icon="pi pi-arrow-left"
                className="p-button-secondary"
                onClick={() => navigate('/course-definition')}
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

export default CourseDefinitionUpdate;
