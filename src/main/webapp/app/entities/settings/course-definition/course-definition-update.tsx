import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './course-definition.reducer';
import { ICourseDefinition } from 'app/shared/model/COURSE-DEFINITION/course-definition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

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
    <PageWrapper>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">
          {isNew ? <Translate contentKey={'tempApp.course.home.createLabel'} /> : <Translate contentKey={'tempApp.course.home.editLabel'} />}
        </h2>
      </div>
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <form >
            <div className="space-y-2 mb-4">
              <Label htmlFor="name" className="text-xs">
                <Translate contentKey={'tempApp.course.name'} />
              </Label>
              <Input
                id="name"
                name="name"
                value={courseDefinitionEntity?.name || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.course.name")}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="description" className="text-xs">
                <Translate contentKey={'tempApp.course.description'} />
              </Label>
              <Input
                id="description"
                name="description"
                value={courseDefinitionEntity?.description || ''}
                onChange={handleInputChange}
                required
                placeholder={translate("tempApp.course.description")}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="order" className="text-xs">
                <Translate contentKey={'tempApp.course.order'} />
              </Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={courseDefinitionEntity?.order ?? ''}
                onChange={(e) => {
                  dispatch(changeEntityField({
                    name: "order",
                    value: parseInt(e.target.value, 10)
                  }));
                }}
                required
                placeholder={translate("tempApp.course.order")}
                className="h-7 text-xs"
              />
            </div>

            <div className="flex gap-2 items-center mt-6">
              <Button
                id="cancel-save"
                variant="secondary"
                onClick={() => navigate('/course-definition')}
                type="button"
                size="sm"
                className="h-7 text-xs"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <Translate contentKey={'common.buttons.back'} />
              </Button>
              <Button
                id="save-entity"
                type="button"
                onClick={handleSubmit}
                disabled={updating}
                size="sm"
                className="h-7 text-xs"
              >
                <Save className="h-4 w-4 mr-2" />
                <Translate contentKey={'common.buttons.save'} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CourseDefinitionUpdate;
