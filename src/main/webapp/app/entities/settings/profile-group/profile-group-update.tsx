import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './profile-group.reducer';
import { getEntities as getTaxProfiles } from 'app/entities/settings/tax-profile/tax-profile.reducer';
import Select from "react-select";
import { getSortState, Translate } from "react-jhipster";
import { Save, ArrowLeft } from 'lucide-react';
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const ProfileGroupUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const profileGroup: IProfileGroup = useAppSelector(state => state.profileGroup.entity);
  const loading = useAppSelector(state => state.profileGroup.loading);
  const updating = useAppSelector(state => state.profileGroup.updating);
  const taxProfilesList = useAppSelector(state => state.taxProfiles.entities);

  const handleChange = <K extends keyof IProfileGroup>(fieldName: K, value: IProfileGroup[K]) => {
    dispatch(changeEntityField({ fieldName, value }));
  };

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const saveEntity = (e, createNew = false) => {
    const entity = {
      ...profileGroup
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
            navigate(`/profile-groups/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/profile-groups/new`)
        }
      })
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxProfiles({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  if (loading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <PageWrapper>
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-base font-bold">{isNew ? `Add New Profile Group` : `Edit Profile Group ${profileGroup.name}`}</h2>

        <div className="bg-white p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
            <Input
              id="name"
              value={profileGroup.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountingId" className="text-xs font-semibold">Accounting ID</Label>
            <Input
              id="accountingId"
              value={profileGroup.accountingId || ''}
              onChange={(e) => handleChange('accountingId', e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profiles" className="text-xs font-semibold">Profiles</Label>
            <Select
              id="profiles"
              options={taxProfilesList}
              value={profileGroup.profiles || []}
              getOptionValue={option => option.id}
              getOptionLabel={option => option.name}
              isMulti={true}
              onChange={(profiles) => handleChange('profiles', profiles as IProfileGroup["profiles"])}
              isClearable={true}
              className="text-xs"
              styles={{
                control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                option: (base) => ({ ...base, fontSize: '0.75rem' }),
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            id="cancel-save"
            data-cy="entityCreateCancelButton"
            onClick={() => navigate(-1)}
            variant="secondary"
            className="h-8 text-xs"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <Translate contentKey="entity.action.back">Back</Translate>
          </Button>
          <Button
            onClick={saveEntity}
            id="save-entity"
            data-cy="entityCreateSaveButton"
            disabled={updating}
            className="h-8 text-xs"
          >
            <Save className="h-4 w-4 mr-2" />
            <Translate contentKey="entity.action.save">Save</Translate>
          </Button>
          <Button
            onClick={(e) => saveEntity(e, true)}
            disabled={updating}
            className="h-8 text-xs"
          >
            <Save className="h-4 w-4 mr-2" />
            <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfileGroupUpdate;
