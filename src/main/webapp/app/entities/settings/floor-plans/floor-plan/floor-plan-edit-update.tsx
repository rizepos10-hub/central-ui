import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {getEntity, updateEntity} from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import {useAppDispatch, useAppSelector} from "app/config/store";
import {IFloorPlan} from "app/shared/model/FLOOR-PLAN/floor-plan.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

const FloorPlanEditUpdate = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const floorPlanEntity = useAppSelector(state => state.floorPlan.entity);
  const {branch: floorPlanBranch} = floorPlanEntity;

  const updateSuccess = useAppSelector(state => state.floorPlan.updateSuccess);

  const [floorPlan, setFloorPlan] = useState<IFloorPlan>();

  const handleChange = (e) => {
    const {name, value} = e.target
    setFloorPlan((prevState) => ({
      ...prevState,
      [name] : value
    }))
  };

  useEffect(() => {
    dispatch(getEntity(id));
    setFloorPlan(floorPlanEntity)
  }, [id,updateSuccess,floorPlanEntity?.id]);

  const saveEntity = () => {
    const savedEntity = {
      ...floorPlan
    }
    dispatch(updateEntity(savedEntity))
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">
          {`Floor Plan / ${floorPlanEntity?.name}`}
        </h1>
      </div>
      <div className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-2">
              Edit Your floor plan details
            </h4>
            <hr className="border-gray-200" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs">Floor Plan Name</Label>
            <Input
              id="name"
              name="name"
              value={floorPlan?.name || ''}
              className="h-9 text-xs"
              placeholder="Floor Plan Name"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="active"
                checked={floorPlan?.active === true}
                onCheckedChange={(checked) => setFloorPlan((prev) => ({...prev, active: checked === true}))}
              />
              <Label htmlFor="active" className="text-sm font-medium">
                Make it active for {floorPlan?.branch?.name}
              </Label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={saveEntity} size="sm" className="h-7 text-xs">
              <Save className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanEditUpdate;
