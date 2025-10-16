import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IBranch } from 'app/shared/model/branch.model';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './branch.reducer';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const BranchUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const branchEntity = useAppSelector(state => state.branch.entity);
  const loading = useAppSelector(state => state.branch.loading);
  const updating = useAppSelector(state => state.branch.updating);
  const updateSuccess = useAppSelector(state => state.branch.updateSuccess);

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value: name === 'numberOfEmployees' ? parseInt(value) || 0 : value }));
  };

  const saveEntity = () => {
    const entity = {
      ...branchEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <PageWrapper>
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold">
            {isNew ? 'Create New Branch' : `Edit ${branchEntity.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="branch-name" className="text-xs">
                    {translate('tempApp.branch.name')}
                  </Label>
                  <Input
                    id="branch-name"
                    name="name"
                    data-cy="name"
                    type="text"
                    required
                    maxLength={100}
                    value={branchEntity?.name || ''}
                    onChange={handleChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch-numberOfEmployees" className="text-xs">
                    {translate('tempApp.branch.numberOfEmployees')}
                  </Label>
                  <Input
                    id="branch-numberOfEmployees"
                    name="numberOfEmployees"
                    data-cy="numberOfEmployees"
                    type="number"
                    value={branchEntity?.numberOfEmployees || ''}
                    onChange={handleChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Link to="/branch" id="cancel-save" data-cy="entityCreateCancelButton">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </Link>
                  </Button>
                  <Button
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    onClick={saveEntity}
                    disabled={updating}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default BranchUpdate;
