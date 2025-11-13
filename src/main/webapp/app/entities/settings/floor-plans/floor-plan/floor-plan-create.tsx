import React, {useState, useRef, useEffect} from 'react';
import {IFloorPlan} from "app/shared/model/FLOOR-PLAN/floor-plan.model";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {getSortState, Translate} from "react-jhipster";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import Select from 'app/shared/components/select/select';
import {IBranch} from "app/shared/model/branch.model";
import {createEntity} from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import {useNavigate} from "react-router-dom";
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/src/main/webapp/app/lib/utils';

const steps = [
  { label: 'Name Your Floor Plan' },
  { label: 'Choose Your Branch' },
  { label: 'Create Your First Section' },
];

const CreateFloorPlan = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [newFloorPlan, setNewFloorPlan] = useState<IFloorPlan>({
    active: false,
  })
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const branchList = useAppSelector(state => state.branch.entities);
  const newFloorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);

  const isFirstNextDisabled = newFloorPlan?.name?.trim() === '' || !newFloorPlan?.name;

  const removeImage = () => {
    setNewFloorPlan(prev => ({
      ...prev,
      sections: [
        {
          ...prev?.sections?.[0],
          backgroundImage: null,
        },
        ...(prev.sections || []).slice(1),
      ],
    }));
  };

  const addImage = (imageInfo) => {
    setNewFloorPlan(prev => ({
      ...prev,
      sections: [
        {
          ...prev?.sections?.[0],
          backgroundImage: imageInfo,
        },
        ...(prev.sections || []).slice(1),
      ],
    }));
  };

  const handleChange = (e) => {
    const {name, value} = e.target
    setNewFloorPlan((prevState) => ({
      ...prevState,
      [name] : value
    }))
  };

  useEffect(() => {
    if(activeIndex === 1){
      dispatch(getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`
      }))
    }
    const { id: newFloorPanId } = newFloorPlanEntity;
    console.log(updateSuccess, newFloorPanId, "hello world")
    if (updateSuccess && newFloorPanId) {
      navigate(`/floor-plan/${newFloorPanId}/manage?page=1&sort=id,asc`);
    }
  },[activeIndex,updateSuccess])

  console.log(newFloorPlan, "size={70}")

  const saveEntity = (e) => {
    e.preventDefault()
    const entity = {
      ...newFloorPlan,
    };

    dispatch(createEntity(entity));
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Steps Indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    activeIndex === index
                      ? "bg-primary text-primary-foreground"
                      : activeIndex > index
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </button>
                <span className="mt-2 text-xs text-center max-w-[120px]">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-2 mb-6",
                    activeIndex > index ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          {/* Step 1: Floor Plan Name */}
          {activeIndex === 0 && (
            <div className="flex flex-col justify-center items-center mt-5 w-full max-w-md">
              <Input
                name="name"
                value={newFloorPlan?.name || ''}
                className="h-12 text-sm"
                placeholder="Floor Plan Name"
                onChange={handleChange}
              />
              <div className="mt-4 ml-auto">
                <Button
                  disabled={isFirstNextDisabled}
                  onClick={() => setActiveIndex((prev) => prev + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Branch */}
          {activeIndex === 1 && (
            <div className="flex flex-col justify-center items-center mt-5 w-full max-w-md">
              <div className="w-full space-y-4">
                <Select
                  name="branch"
                  options={branchList}
                  getOptionLabel={(option: IBranch) => option.name}
                  getOptionValue={(option: IBranch) => option.id}
                  value={newFloorPlan?.branch}
                  placeholder="Branch Name"
                  onChange={(selectedBranch: IBranch) => setNewFloorPlan((prev) => ({...prev, branch: selectedBranch}))}
                />
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-semibold">
                    Make it active for {newFloorPlan?.branch?.name || "selected branch"}
                  </Label>
                  <Checkbox
                    checked={newFloorPlan.active}
                    onCheckedChange={(checked) => setNewFloorPlan((prev) => ({...prev, active: checked as boolean}))}
                  />
                </div>
              </div>
              <div className="mt-4 ml-auto">
                <Button
                  disabled={!newFloorPlan?.branch}
                  onClick={() => setActiveIndex((prev) => prev + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Create First Section */}
          {activeIndex === 2 && (
            <div className="flex flex-col justify-center items-center mt-5 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4 self-start">Your First Section Info</h3>
              <div className="flex flex-col w-full space-y-6">
                {/* Section Name */}
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Section Name</Label>
                  <Input
                    type="text"
                    className="h-8 text-xs w-96"
                    name="name"
                    required={true}
                    value={newFloorPlan.sections?.[0]?.name || ''}
                    onChange={(e) =>
                      setNewFloorPlan((prev) => ({
                        ...prev,
                        sections: [
                          {
                            ...prev.sections?.[0],
                            name: e.target.value,
                            order: 1,
                          },
                          ...(prev.sections || []).slice(1),
                        ],
                      }))
                    }
                  />
                </div>

                {/* Dimensions */}
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Dimensions</Label>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      placeholder="Width"
                      className="h-8 text-xs w-44"
                      required={true}
                      value={newFloorPlan?.sections?.[0]?.dimensions?.width ?? ''}
                      onChange={(e) =>
                        setNewFloorPlan((prev) => ({
                          ...prev,
                          sections: [
                            {
                              ...prev.sections?.[0],
                              dimensions: {
                                ...prev.sections?.[0]?.dimensions,
                                width: parseInt(e.target.value) ?? null,
                              },
                            },
                            ...(prev.sections || []).slice(1),
                          ],
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Height"
                      className="h-8 text-xs w-44"
                      required={true}
                      value={newFloorPlan?.sections?.[0]?.dimensions?.height ?? ''}
                      onChange={(e) =>
                        setNewFloorPlan((prev) => ({
                          ...prev,
                          sections: [
                            {
                              ...prev.sections?.[0],
                              dimensions: {
                                ...prev.sections[0]?.dimensions,
                                height: parseInt(e.target.value) ?? null,
                              },
                            },
                            ...(prev.sections || []).slice(1),
                          ],
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Image */}
                <div className="flex flex-col space-y-2">
                  <Label className="text-sm">
                    <Translate contentKey={"tempApp.table.image"}>Image</Translate>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => addImage(transformAttachmentStructure(files, 'toIAttachment')[0])}
                    defaultValues={transformAttachmentStructure(newFloorPlan?.sections?.[0]?.backgroundImage ? [newFloorPlan?.sections?.[0]?.backgroundImage] : [], 'toFileLibraryListItem')}
                  />
                </div>

                {/* Visible Checkbox */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Visible</Label>
                  <Checkbox
                    checked={newFloorPlan.sections?.[0]?.visible || false}
                    onCheckedChange={(checked) =>
                      setNewFloorPlan((prev) => ({
                        ...prev,
                        sections: [
                          {
                            ...prev.sections?.[0],
                            visible: checked as boolean,
                          },
                          ...(prev.sections || []).slice(1),
                        ],
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-6 ml-auto">
                <Button
                  type="submit"
                  onClick={saveEntity}
                  className="h-8 text-xs"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CreateFloorPlan;
