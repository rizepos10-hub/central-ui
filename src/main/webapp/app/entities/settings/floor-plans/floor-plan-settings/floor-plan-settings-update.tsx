import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, reset } from './floor-plan-settings.reducer';
import {IFloorPlanSettings} from "app/shared/model/FLOOR-PLAN/floor-plan-settings.model";
import {Translate} from "react-jhipster";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const FloorPlanSettingsUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [floorPlanSettings, setFloorPlanSettings] = useState<IFloorPlanSettings>({
    sectionDimensions: null,
    tableDimensions: null,
    tableImage: null,
    sectionBackground: null
  });

  const floorPlanSettingsEntity = useAppSelector(state => state.floorPlanSettings.entity);
  const loading = useAppSelector(state => state.floorPlanSettings.loading);
  const updating = useAppSelector(state => state.floorPlanSettings.updating);
  const updateSuccess = useAppSelector(state => state.floorPlanSettings.updateSuccess);

  useEffect(() => {
    dispatch(getEntity());
    return () => {
      dispatch(reset())
    }
  }, []);

  useEffect(() => {
    if(floorPlanSettingsEntity){
      setFloorPlanSettings(floorPlanSettingsEntity)
    }
  }, [updateSuccess,loading]);

  const handleChange = (value, name) => {
    const [property, subProperty] = name.split('-');

    setFloorPlanSettings((prevState) => {
      const newState = { ...prevState };
      if (subProperty) {
        newState[property] = {
          ...newState[property],
          [subProperty]: parseFloat(value) ?? 0,
        };
      }
      return newState;
    });
  };

  const addTableImage = (imageInfo) => {
    setFloorPlanSettings(prev => ({
      ...prev,
      tableImage: imageInfo
    }))
  }
  const addSectionBackgroundImage = (imageInfo) => {
    setFloorPlanSettings(prev => ({
      ...prev,
      sectionBackground: imageInfo
    }))
  }

  const saveEntity = () => {
    const entity = {
      ...floorPlanSettings,
    };
    dispatch(updateEntity(entity));
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Edit Floor Plan Settings</h2>
      </div>
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                  <h5 className="text-lg font-semibold">Section Dimensions</h5>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        width
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="sectionDimensions-width"
                        required={true}
                        value={floorPlanSettings?.sectionDimensions?.width ?? ''}
                        onChange={(e) => handleChange(e.target.value, "sectionDimensions-width")}
                        className="h-7 text-xs rounded-none border-l-0 border-r-0"
                      />
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 border-border rounded-r-md h-7">
                        px
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        height
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="sectionDimensions-height"
                        required={true}
                        value={floorPlanSettings?.sectionDimensions?.height ?? ''}
                        onChange={(e) => handleChange(e.target.value, "sectionDimensions-height")}
                        className="h-7 text-xs rounded-none border-l-0 border-r-0"
                      />
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 border-border rounded-r-md h-7">
                        px
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-lg font-semibold">Table Dimensions</h5>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        width
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="tableDimensions-width"
                        required={true}
                        value={floorPlanSettings?.tableDimensions?.width ?? ''}
                        onChange={(e) => handleChange(e.target.value, "tableDimensions-width")}
                        className="h-7 text-xs rounded-none border-l-0 border-r-0"
                      />
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 border-border rounded-r-md h-7">
                        px
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        height
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="tableDimensions-height"
                        required={true}
                        value={floorPlanSettings?.tableDimensions?.height ?? ''}
                        onChange={(e) => handleChange(e.target.value, "tableDimensions-height")}
                        className="h-7 text-xs rounded-none border-l-0 border-r-0"
                      />
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 border-border rounded-r-md h-7">
                        px
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey={"tempApp.floorPlanSettings.tableImage"}>Table Image</Translate>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => addTableImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
                    defaultValues={transformAttachmentStructure(floorPlanSettings.tableImage ? [floorPlanSettings.tableImage] : [], 'toFileLibraryListItem')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey={"tempApp.floorPlanSettings.sectionBackground"}>Section Background Image</Translate>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => addSectionBackgroundImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
                    defaultValues={transformAttachmentStructure(floorPlanSettings.sectionBackground ? [floorPlanSettings.sectionBackground] : [], 'toFileLibraryListItem')}
                  />
                </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(-1)}
                  variant="secondary"
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={saveEntity}
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default FloorPlanSettingsUpdate;
