import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './pizza-size.reducer';
import { IPizzaSize } from "app/shared/model/PIZZA/pizza-size.model";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PizzaSizeUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const orderParam = urlParams.get('order');
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaSize, setPizzaSize] = useState<IPizzaSize>({
    name: '',
  });

  const pizzaSizeEntity = useAppSelector(state => state.pizzaSize.entity);
  const loading = useAppSelector(state => state.pizzaSize.loading);
  const updating = useAppSelector(state => state.pizzaSize.updating);


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
    if (pizzaSizeEntity) {
      setPizzaSize(pizzaSizeEntity)
    }
  }, [pizzaSizeEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaSize(prevState => ({ ...prevState, [name]: value }));
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity = {
      ...pizzaSize,
      order: isNew ? Number(orderParam) : pizzaSize.order
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
            navigate(`/pizza-size/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-size/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{isNew ? "Add New Size" : "Edit Size"}</h2>
      </div>
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <p className="text-xs">Loading...</p>
            ) : (
              <form>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pizza-size-name" className="text-xs">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-size-name"
                      value={pizzaSize.name || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating}
                    className="h-8 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    onClick={(e) => saveEntity(e, true)}
                    id="save-entity-new"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating}
                    className="h-8 text-xs"
                  >
                    <Save className="h-3 w-3" />
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

export default PizzaSizeUpdate;
