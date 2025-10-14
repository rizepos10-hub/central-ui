import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tv-display.reducer';
import { getSortState, Translate } from "react-jhipster";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ITvDisplay } from "app/shared/model/TV/tv-display.model";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const TvDisplayUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const tvDisplay: ITvDisplay = useAppSelector(state => state.tvDisplay.entity);
  const loading = useAppSelector(state => state.tvDisplay.loading);
  const updating = useAppSelector(state => state.tvDisplay.updating);
  const updateSuccess = useAppSelector(state => state.tvDisplay.updateSuccess);
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name: name as any, value }));
  };

  const saveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    const entity = {
      ...tvDisplay,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">{isNew ? "Add New Tv Display" : "Edit Tv Display"}</h2>
        </div>

        <div className="border rounded-lg p-4 bg-white max-w-2xl">
          {loading ? (
            <p className="text-sm">Loading...</p>
          ) : (
            <form onSubmit={saveEntity} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tv-display-name" className="text-xs">
                  <Translate contentKey="tempApp.tvDisplay.name">Name</Translate>
                </Label>
                <Input
                  type="text"
                  name="name"
                  required={true}
                  id="tv-display-name"
                  value={tvDisplay.name || ''}
                  onChange={handleChange}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <MediaLibrary
                  handleFilesSelectCallback={(files) => dispatch(changeEntityField({ name: 'attachments', value: transformAttachmentStructure(files, 'toIAttachment') }))}
                  defaultValues={transformAttachmentStructure(tvDisplay.attachments ? tvDisplay.attachments : [], 'toFileLibraryListItem')}
                  multiSelect
                />
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  className="h-8 text-xs"
                  asChild
                >
                  <Link to="/tv-display">
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back
                  </Link>
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default TvDisplayUpdate;
