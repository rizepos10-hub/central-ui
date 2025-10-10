import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { Save, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './brand.reducer';
import { IBrand } from "app/shared/model/brand.model";
import MediaLibrary from "app/shared/components/media-library/media-library";
import { transformAttachmentStructure } from "app/shared/util/attachment-utils";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const BrandUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const brandEntity: IBrand = useAppSelector(state => state.brand.entity);
  const loading = useAppSelector(state => state.brand.loading);
  const updating = useAppSelector(state => state.brand.updating);

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

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...brandEntity,
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
            navigate(`/brand/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/brand/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <Card className="max-w-2xl">
        <CardHeader className="p-2">
          <CardTitle className="text-sm font-semibold">
            {isNew ? (
              <Translate contentKey={'tempApp.createNewBRand'}>Create New Brand</Translate>
            ) : (
              <Translate contentKey={'tempApp.editBrand'}>Edit Brand</Translate>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form onSubmit={saveEntity} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  <Translate contentKey={'common.name'} />
                </Label>
                <Input
                  type="text"
                  name="name"
                  required={true}
                  id="name"
                  value={brandEntity?.name || ''}
                  onChange={handleChange}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  <Translate contentKey={'common.image'} />
                </Label>
                <MediaLibrary
                  handleFilesSelectCallback={(files) => dispatch(changeEntityField({ name: 'logo', value: transformAttachmentStructure(files, 'toIAttachment')[0] }))}
                  defaultValues={transformAttachmentStructure(brandEntity.logo ? [brandEntity.logo] : [], 'toFileLibraryListItem')}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => saveEntity(e, true)}
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-1" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default BrandUpdate;
