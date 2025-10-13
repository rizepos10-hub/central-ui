import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './table.reducer';
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import { getSortState, Translate } from "react-jhipster";
import Select from "react-select";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IFloorPlanTable } from "app/shared/model/FLOOR-PLAN/floor-plan-table.model";
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const FloorPlanTableUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [floorPlanTable, setFloorPlanTable] = useState<IFloorPlanTable>({
    name: '',
    image: null,
    branch: null,
    dimensions: null
  });

  const branchList = useAppSelector(state => state.branch.entities)
  const floorPlanTableEntity = useAppSelector(state => state.floorPlanTable.entity);
  const loading = useAppSelector(state => state.floorPlanTable.loading);
  const updating = useAppSelector(state => state.floorPlanTable.updating);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: paginationState.sort
    }))
  }, []);

  useEffect(() => {
    if (floorPlanTableEntity) {
      setFloorPlanTable(floorPlanTableEntity)
    }
  }, [floorPlanTableEntity?.name]);

  const handleBranchChange = (selectedBranch) => {
    setFloorPlanTable(prevState => ({ ...prevState, branch: selectedBranch }))
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFloorPlanTable(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDimensionChange = (type, value) => {
    setFloorPlanTable((prevState) => ({
      ...prevState, dimensions: { ...prevState.dimensions, [type]: parseFloat(value) || 0, },
    }));
  };

  const addImage = (imageInfo) => {
    setFloorPlanTable(prev => ({
      ...prev,
      image: imageInfo
    }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...floorPlanTable,
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
            navigate(`/floor-plan/table/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/floor-plan/table/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{isNew ? "Add New Floor Plan Table" : "Edit Floor Plan Table"}</h2>
      </div>
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={saveEntity}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs">
                    <Translate contentKey={"tempApp.table.name"}>Name</Translate>
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    required={true}
                    id="floor-plan-name"
                    value={floorPlanTable.name || ''}
                    onChange={handleChange}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey={"tempApp.table.dimensions"}>Dimensions</Translate>
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        <Translate contentKey={"tempApp.table.width"}>Width</Translate>
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="dimension-width"
                        required={true}
                        value={floorPlanTable?.dimensions?.width || ''}
                        onChange={(e) => handleDimensionChange("width", e.target.value)}
                        className="h-7 text-xs rounded-none border-l-0 border-r-0"
                      />
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-l-0 border-border rounded-r-md h-7">
                        px
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md h-7">
                        <Translate contentKey={"tempApp.table.height"}>Height</Translate>
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        name="dimension-height"
                        required={true}
                        value={floorPlanTable?.dimensions?.height || ''}
                        onChange={(e) => handleDimensionChange("height", e.target.value)}
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
                    <Translate contentKey={"tempApp.table.branch"}>Branch</Translate>
                  </Label>
                  <Select
                    options={branchList}
                    onChange={handleBranchChange}
                    getOptionValue={option => option.id}
                    getOptionLabel={option => option.name}
                    name={"branch"}
                    value={floorPlanTable.branch || null}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => addImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
                    defaultValues={transformAttachmentStructure(floorPlanTable.image ? [floorPlanTable.image] : [], 'toFileLibraryListItem')}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  id="cancel-save"
                  data-cy="entityCreateCancelButton"
                  onClick={() => navigate(-1)}
                  variant="secondary"
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  onClick={saveEntity}
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  type="submit"
                  disabled={updating}
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                <Button
                  onClick={(e) => saveEntity(e, true)}
                  id="save-entity-new"
                  data-cy="entityCreateSaveButton"
                  type="submit"
                  disabled={updating}
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default FloorPlanTableUpdate;
