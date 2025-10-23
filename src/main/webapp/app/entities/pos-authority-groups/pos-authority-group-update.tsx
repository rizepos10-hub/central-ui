import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { changeEntityField, createEntity, getEntity, reset, updateEntity } from './pos-authority-group.reducer';
import { IPosAuthorityGroup, POSAuthorityEnum } from 'app/shared/model/pos-authority-group';
import Select from 'app/shared/components/select/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

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

  useEffect(() => {
    if (updateSuccess) {
      navigate('/pos-authority-group');
    }
  }, [updateSuccess]);

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
    label: authority.replace('_', ' '),
  }));

  const selectedOptions = authorityOptions.filter((option) =>
    posAuthorityGroupEntity?.authorities?.includes(option.value)
  );

  const handleChange = (selected) => {
    const selectedAuthorities = selected ? selected.map((opt) => opt.value) : [];
    dispatch(
      changeEntityField({
        name: 'authorities',
        value: selectedAuthorities,
      })
    );
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? <Translate contentKey={'tempApp.pos-authority-group.home.createLabel'} /> : <Translate contentKey={'tempApp.pos-authority-group.home.editLabel'} />}
        </h2>

        <Card>
          <CardContent className="pt-6">
            <form  className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">
                  <Translate contentKey={'tempApp.pos-authority-group.name'} />
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={posAuthorityGroupEntity?.name || ''}
                  onChange={handleInputChange}
                  required
                  placeholder={translate("tempApp.pos-authority-group.name")}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs">
                  <Translate contentKey={'tempApp.pos-authority-group.description'} />
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={posAuthorityGroupEntity?.description || ''}
                  onChange={handleInputChange}
                  required
                  placeholder={translate("tempApp.pos-authority-group.description")}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorities" className="text-xs">
                  <Translate contentKey={'tempApp.pos-authority-group.authorities'} />
                </Label>
                <Select
                  isMulti
                  options={authorityOptions}
                  value={selectedOptions}
                  onChange={handleChange}
                  placeholder="Select authorities"
                  className="text-xs"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate('/pos-authority-group')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <Translate contentKey={'common.buttons.back'} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSubmit}
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey={'common.buttons.save'} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default PosAuthorityGroupUpdate;
