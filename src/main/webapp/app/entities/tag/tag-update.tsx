import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tag.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ITag } from "app/shared/model/TAG/tag.model";

export const TagUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const tagEntity: ITag = useAppSelector(state => state.tag.entity);
  const loading = useAppSelector(state => state.tag.loading);
  const updating = useAppSelector(state => state.tag.updating);
  const updateSuccess = useAppSelector(state => state.tag.updateSuccess);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  const saveEntity = (e, createNew = false) => {
    e?.preventDefault();
    const entity = {
      ...tagEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/tag/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/tag/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? (
            <Translate contentKey={'tag.update.create.title'}>Create New tag</Translate>
          ) : (
            <Translate contentKey={'tag.update.edit.title'}>Edit tag</Translate>
          )}
        </h2>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-xs">Loading...</p>
            ) : (
              <form onSubmit={saveEntity} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name" className="text-xs">
                    <Translate contentKey={'tag.update.name'}>Tag Name</Translate>
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    required={true}
                    id="tag-name"
                    value={tagEntity?.name || ''}
                    onChange={handleChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => saveEntity(e, true)}
                    disabled={updating}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default TagUpdate;
