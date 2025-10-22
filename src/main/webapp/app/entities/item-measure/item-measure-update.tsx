import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Translate } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './item-measure.reducer';
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ItemMeasureUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [itemMeasure, setItemMeasure] = useState<IItemMeasure>({
    name: '',
    code: '',
  });

  const itemMeasureEntity = useAppSelector(state => state.itemMeasure.entity);
  const loading = useAppSelector(state => state.itemMeasure.loading);
  const updating = useAppSelector(state => state.itemMeasure.updating);

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    if (itemMeasureEntity) {
      setItemMeasure(itemMeasureEntity)
    }
  }, [itemMeasureEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setItemMeasure(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...itemMeasure,
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
            navigate(`/item-measure/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/item-measure/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold">{isNew ? "Add New Item Measure" : "Edit Item Measure"}</h2>

      <div className="bg-white p-6 rounded-md border">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input
                type="text"
                name="name"
                required={true}
                id="name"
                value={itemMeasure.name || ''}
                onChange={handleChange}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs">Code</Label>
              <Input
                type="text"
                name="code"
                id="code"
                value={itemMeasure.code || ''}
                onChange={handleChange}
                className="h-8 text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 text-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <Translate contentKey="entity.action.back">Back</Translate>
              </Button>
              <Button
                size="sm"
                onClick={saveEntity}
                type="button"
                disabled={updating}
                className="h-8 text-xs"
              >
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
              <Button
                size="sm"
                onClick={(e) => saveEntity(e, true)}
                type="button"
                disabled={updating}
                className="h-8 text-xs"
              >
                <Save className="h-4 w-4" />
                <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};

export default ItemMeasureUpdate;
