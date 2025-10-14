import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {getSortState, isNumber, Translate, translate} from 'react-jhipster';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {mapIdList, overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset }   from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ToppingGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const termEntity = useAppSelector(state => state.toppingGroup.entity);
  const loading = useAppSelector(state => state.toppingGroup.loading);
  const updating = useAppSelector(state => state.toppingGroup.updating);
  const updateSuccess = useAppSelector(state => state.toppingGroup.updateSuccess);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    return () => {
      dispatch(reset());
    };
  }, []);

  useEffect(() => {
    if (!loading && termEntity && !isNew) {
      resetForm({ name: termEntity.name });
    }
  }, [termEntity, loading, isNew]);

  useEffect(() => {
    const {id: newTermId} = termEntity
    if (updateSuccess && newTermId) {
      navigate(`/pizza-topping-group/${newTermId}/edit`)
    }
  }, [updateSuccess, termEntity ]);

  const saveEntity = (data) => {
    const entity = {
      ...termEntity,
      ...data,
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold" data-cy="TermCreateUpdateHeading">
            {isNew ? "Create a Menu Category" : "Edit Menu Category"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term-name" className="text-xs">
                {translate('tempApp.term.name')}
              </Label>
              <Input
                id="term-name"
                type="text"
                className="h-8 text-xs"
                data-cy="name"
                {...register('name', {
                  required: translate('entity.validation.required'),
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message as string}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate('/pizza-topping-group')}
                id="cancel-save"
                data-cy="entityCreateCancelButton"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleSubmit(saveEntity)}
                disabled={updating}
                id="save-entity"
                data-cy="entityCreateSaveButton"
              >
                <Save className="h-3 w-3 mr-1" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToppingGroupUpdate;

