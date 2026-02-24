import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
import Select from 'app/shared/components/select/select';
import {
  getEntity,
  updateEntity,
  reset,
  createEntity,
  changeEntityField,
  assignCategory,
  unassignCategory,
  getCategoryAssignments,
  assignCustomer,
  unassignCustomer,
  getCustomerAssignments
} from './user.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { IUser } from 'app/shared/model/user.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ITerm } from 'app/shared/model/term.model';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { toast } from 'react-toastify';

export const UserUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const userEntity: IUser = useAppSelector(state => state.SalesmenUser.entity);
  const loading = useAppSelector(state => state.SalesmenUser.loading);
  const updating = useAppSelector(state => state.SalesmenUser.updating);
  const updateSuccess = useAppSelector(state => state.SalesmenUser.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);
  const customers: ICustomer[] = useAppSelector(state => state.customer.entities);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<Map<string, string>>(new Map()); // categoryId -> assignmentId
  const [assignedCustomerIds, setAssignedCustomerIds] = useState<Map<string, string>>(new Map()); // customerId -> assignmentId

  const handleClose = () => {
    navigate('/salesmen-user');
  };

  const updateUserFieldvalue = (fieldName, value) => {
    dispatch(changeEntityField({ name: fieldName, value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      const payload: IUser = {
        id: isNew ? undefined : userEntity.id,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        username: userEntity.username || userEntity.email,
        ...(userEntity.password ? { password: userEntity.password } : {}),
        branches: userEntity.branches || [],
      };

      if (isNew) {
        dispatch(createEntity(payload));
      } else {
        dispatch(updateEntity(payload));
      }
    } catch (error) {
      // TODO: surface error to user if needed
    }
  };

  useEffect(() => {
    dispatch(
      getBranches({
        page: 0,
        size: 1000,
        sort: `id,asc`,
      })
    );

    dispatch(
      getRetailCategories({
        page: 0,
        size: 1000,
        sort: `id,asc`,
      })
    );

    dispatch(
      getCustomers({
        page: 0,
        size: 1000,
        sort: `id,asc`,
        query: '',
      })
    );

    if (isNew) {
      dispatch(reset());
      setAssignedCategoryIds(new Map());
      setAssignedCustomerIds(new Map());
    } else {
      const userId = id;
      dispatch(getEntity(userId)).then(() => {
        if (userId) {
          // Try to fetch existing category assignments
          dispatch(getCategoryAssignments(userId))
            .then((result) => {
              if (getCategoryAssignments.fulfilled.match(result)) {
                const assignments = result.payload || [];
                const assignmentMap = new Map<string, string>();
                assignments.forEach((assignment: any) => {
                  if (assignment.categoryId && assignment.id) {
                    assignmentMap.set(assignment.categoryId, assignment.id as string);
                  }
                });
                setAssignedCategoryIds(assignmentMap);
              }
            })
            .catch(() => {
              // If endpoint doesn't exist or fails, we'll track assignments locally
            });

          // Try to fetch existing customer assignments
          dispatch(getCustomerAssignments(userId))
            .then((result) => {
              if (getCustomerAssignments.fulfilled.match(result)) {
                const assignments = result.payload || [];
                const assignmentMap = new Map<string, string>();
                assignments.forEach((assignment: any) => {
                  if (assignment.customerId && assignment.id) {
                    assignmentMap.set(assignment.customerId, assignment.id as string);
                  }
                });
                setAssignedCustomerIds(assignmentMap);
              }
            })
            .catch(() => {
              // If endpoint doesn't exist or fails, we'll track assignments locally
            });
        }
      });
    }
  }, [updateSuccess, dispatch, id]);

  const categoryOptions = useMemo(() => {
    return retailCategories.map(category => ({
      value: category.id,
      label: category.name || 'Unnamed category',
    }));
  }, [retailCategories]);

  const selectedCategories = useMemo(() => {
    return Array.from(assignedCategoryIds.keys()).map(categoryId => ({
      value: categoryId,
      label: retailCategories.find(cat => cat.id === categoryId)?.name || 'Unknown',
    }));
  }, [assignedCategoryIds, retailCategories]);

  const customerOptions = useMemo(() => {
    return customers.map(customer => {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      return {
        value: String(customer.id),
        label: customer.businessDetails?.businessName || fullName || customer.email || customer.phone || 'Unnamed customer',
      };
    });
  }, [customers]);

  const selectedCustomers = useMemo(() => {
    return Array.from(assignedCustomerIds.keys()).map(customerId => ({
      value: customerId,
      label:
        customerOptions.find(customer => customer.value === customerId)?.label || 'Unknown',
    }));
  }, [assignedCustomerIds, customerOptions]);

  const handleCategoryChange = async (selectedOptions: any[]) => {
    if (!userEntity.id) {
      toast.error('Please save the user first before assigning categories');
      return;
    }

    const normalizedSelectedOptions = selectedOptions || [];
    const currentCategoryIds = new Set(Array.from(assignedCategoryIds.keys()));
    const newCategoryIds = new Set(normalizedSelectedOptions.map(opt => opt.value));

    // Find categories to assign (in new but not in current)
    const toAssign = normalizedSelectedOptions.filter(opt => !currentCategoryIds.has(opt.value));

    // Find categories to unassign (in current but not in new)
    const toUnassign = Array.from(currentCategoryIds).filter(catId => !newCategoryIds.has(catId));

    // Unassign categories
    for (const categoryId of toUnassign) {
      const assignmentId = assignedCategoryIds.get(categoryId);
      if (assignmentId) {
        try {
          await dispatch(unassignCategory(assignmentId)).unwrap();
          setAssignedCategoryIds(prev => {
            const next = new Map(prev);
            next.delete(categoryId);
            return next;
          });
        } catch (error) {
          toast.error(`Failed to unassign category: ${error}`);
        }
      }
    }

    // Assign new categories
    for (const option of toAssign) {
      try {
        const result = await dispatch(
          assignCategory({
            salesmanId: userEntity.id,
            categoryId: option.value,
          })
        ).unwrap();
        
        // Store the assignment ID for future unassignment
        if (result?.id) {
          setAssignedCategoryIds(prev => {
            const next = new Map(prev);
            next.set(option.value, result.id);
            return next;
          });
        }
      } catch (error) {
        toast.error(`Failed to assign category: ${error}`);
      }
    }
  };

  const handleCustomerChange = async (selectedOptions: any[]) => {
    if (!userEntity.id) {
      toast.error('Please save the user first before assigning customers');
      return;
    }

    const normalizedSelectedOptions = selectedOptions || [];
    const currentCustomerIds = new Set(Array.from(assignedCustomerIds.keys()));
    const newCustomerIds = new Set(normalizedSelectedOptions.map(opt => String(opt.value)));

    // Find customers to assign (in new but not in current)
    const toAssign = normalizedSelectedOptions.filter(opt => !currentCustomerIds.has(String(opt.value)));

    // Find customers to unassign (in current but not in new)
    const toUnassign = Array.from(currentCustomerIds).filter(customerId => !newCustomerIds.has(customerId));

    // Unassign customers
    for (const customerId of toUnassign) {
      const assignmentId = assignedCustomerIds.get(customerId);
      if (assignmentId) {
        try {
          await dispatch(unassignCustomer(assignmentId)).unwrap();
          setAssignedCustomerIds(prev => {
            const next = new Map(prev);
            next.delete(customerId);
            return next;
          });
        } catch (error) {
          toast.error(`Failed to unassign customer: ${error}`);
        }
      }
    }

    // Assign new customers
    for (const option of toAssign) {
      try {
        const result = await dispatch(
          assignCustomer({
            salesmanId: userEntity.id,
            customerId: String(option.value),
          })
        ).unwrap();

        // Store the assignment ID for future unassignment
        if (result?.id) {
          setAssignedCustomerIds(prev => {
            const next = new Map(prev);
            next.set(String(option.value), result.id);
            return next;
          });
        }
      } catch (error) {
        toast.error(`Failed to assign customer: ${error}`);
      }
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? translate("tempApp.createNewUser") : translate("tempApp.editUser")}
        </h2>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs">
                  <Translate contentKey="tempApp.username" />
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={userEntity?.username || ''}
                  onChange={e => updateUserFieldvalue('username', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Defaults to email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs">
                  <Translate contentKey="tempApp.firstName" />
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userEntity?.firstName || ''}
                  onChange={e => updateUserFieldvalue('firstName', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs">
                  <Translate contentKey="tempApp.lastName" />
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userEntity?.lastName || ''}
                  onChange={e => updateUserFieldvalue('lastName', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  <Translate contentKey="tempApp.email" />
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userEntity?.email}
                  onChange={e => updateUserFieldvalue('email', e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">
                  <Translate contentKey="tempApp.password" />
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={userEntity?.password || ''}
                  onChange={e => updateUserFieldvalue('password', e.target.value)}
                  required={isNew}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  <Translate contentKey={'common.branches'} />
                </Label>
                <Select
                  value={userEntity.branches}
                  isMulti
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={e => updateUserFieldvalue('branches', e)}
                  options={branchList}
                  className="text-xs"
                />
              </div>

              {!isNew && (
                <div className="space-y-2">
                  <Label className="text-xs">
                    Categories
                  </Label>
                  <Select
                    value={selectedCategories}
                    isMulti
                    onChange={handleCategoryChange}
                    options={categoryOptions}
                    className="text-xs"
                    placeholder="Select categories to assign"
                  />
                </div>
              )}

              {!isNew && (
                <div className="space-y-2">
                  <Label className="text-xs">
                    Customers
                  </Label>
                  <Select
                    value={selectedCustomers}
                    isMulti
                    onChange={handleCustomerChange}
                    options={customerOptions}
                    className="text-xs"
                    placeholder="Select customers to assign"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => navigate('/salesmen-user')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <Translate contentKey="common.buttons.back" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSubmit}
                  disabled={updating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <Translate contentKey="common.buttons.save" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserUpdate;
