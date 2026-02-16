import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getRoles, updateRoles, changeEntityField } from "app/entities/back-office-user/user.reducer";
import { translate } from "react-jhipster";
import { IBackOfficeUser } from "app/shared/model/back-offic-user.model";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/**
 * Formats authority/role names from "ROLE_SOME_THING" to "Role Some Thing"
 */
const formatAuthorityName = (name: string): string => {
  if (!name) return name;
  
  // Replace ROLE_ prefix with "Role " if present, otherwise keep as is
  const processedName = name.startsWith('ROLE_') ? 'Role_' + name.substring(5) : name;
  
  // Split by underscore, capitalize first letter of each word, lowercase the rest
  return processedName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function Authorities({ userEntity }: { userEntity: IBackOfficeUser }) {
  const dispatch = useAppDispatch();
  const apiRoles = useAppSelector(state => state.user.roles?.['groups']);

  useEffect(() => {
    dispatch(getRoles());
  }, [dispatch]);

  const updateUserFieldValue = (fieldName: any, value: any) => {
    if (fieldName.includes('.')) {
      const [parentField, childField] = fieldName.split('.');
      dispatch(
        changeEntityField({
          name: parentField,
          value: {
            ...userEntity[parentField],
            [childField]: value,
          },
        })
      );
    } else {
      dispatch(changeEntityField({ name: fieldName, value }));
    }
  };

  const roles = userEntity.userRole?.groups;

  const handleRoleChange = (groupName: string, newValue: boolean) => {
    const updatedRoles = roles?.map(role => {
      if (role.groupName === groupName) {
        return {
          ...role,
          assigned: newValue,
        };
      }
      return role;
    });
    if (!userEntity?.user) {
      dispatch(updateRoles(updatedRoles));
    } else {
      updateUserFieldValue('userRole.groups', updatedRoles);
    }
  };

  const areAllRolesAuthoritiesAssigned = (groupName: string) => {
    const targetedRole = roles.find(role => role.groupName === groupName);
    return targetedRole?.authorities.every(authority => authority.assigned) || false;
  };

  const handleAllRoleAuthoritiesChange = (groupName: string, checked: boolean) => {
    const authorityMap = new Map();
    roles.forEach(role => {
      role.authorities.forEach(authority => {
        const existingAuthorities = authorityMap.get(authority.authorityName) || [];
        existingAuthorities.push(role.groupName);
        authorityMap.set(authority.authorityName, existingAuthorities);
      });
    });
    const updatedRoles = roles.map(role => {
      if (role.groupName === groupName) {
        return {
          ...role,
          authorities: role.authorities.map(authority => ({
            ...authority,
            assigned: checked,
          })),
        };
      }
      const updatedAuthorities = role.authorities.map(authority => {
        const associatedRoles = authorityMap.get(authority.authorityName);
        if (associatedRoles.includes(groupName)) {
          return {
            ...authority,
            assigned: checked,
          };
        }
        return authority;
      });
      return { ...role, authorities: updatedAuthorities };
    });
    if (!userEntity?.user) {
      dispatch(updateRoles(updatedRoles));
    } else {
      updateUserFieldValue('userRole.groups', updatedRoles);
    }
  };

  const handleAuthorityChange = (groupName: string, authorityName: string, newValue: boolean) => {
    const updatedRoles = roles.map(role => {
      if (role.groupName === groupName) {
        const updatedAuthorities = role.authorities.map(authority => {
          if (authority.authorityName === authorityName) {
            return { ...authority, assigned: newValue };
          }
          return authority;
        });
        return { ...role, authorities: updatedAuthorities };
      }
      return role;
    });
    if (!userEntity?.user) {
      dispatch(updateRoles(updatedRoles));
    } else {
      updateUserFieldValue('userRole.groups', updatedRoles);
    }
  };

  const getAssignedCount = (role: any) => {
    const assignedCount = role.authorities.filter((auth: any) => auth.assigned).length;
    const totalCount = role.authorities.length;
    return { assignedCount, totalCount };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles?.map((role, index) => {
        const { assignedCount, totalCount } = getAssignedCount(role);
        const allAssigned = areAllRolesAuthoritiesAssigned(role.groupName);

        return (
          <Card key={`role-${index}-${role.groupName}`} className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {formatAuthorityName(role.groupName)}
                  <Badge variant={role.assigned ? "default" : "secondary"} className="text-xs">
                    {role.assigned ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </div>
              <div className="text-xs text-muted-foreground">
                {assignedCount} of {totalCount} permissions
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-3 pb-3">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                  <Label htmlFor={`role-${role.groupName}`} className="text-xs font-medium cursor-pointer">
                    {role.assigned
                      ? translate("tempApp.deactivateRole")
                      : translate("tempApp.activateRole")}
                  </Label>
                  <Checkbox
                    id={`role-${role.groupName}`}
                    checked={role.assigned}
                    onCheckedChange={(checked) => handleRoleChange(role.groupName, checked as boolean)}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-md bg-primary/5">
                  <Label htmlFor={`authorities-${role.groupName}`} className="text-xs font-medium cursor-pointer">
                    {allAssigned
                      ? translate("tempApp.uncheckAllAuthorities")
                      : translate("tempApp.checkAllAuthorities")}
                  </Label>
                  <Checkbox
                    id={`authorities-${role.groupName}`}
                    checked={allAssigned}
                    onCheckedChange={(checked) => handleAllRoleAuthoritiesChange(role.groupName, checked as boolean)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Permissions:</div>
                {role.authorities?.map((authority, i) => (
                  <div
                    key={`authority-${i}-${role.groupName}-${authority.authorityName}`}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`auth-${role.groupName}-${authority.authorityName}`}
                      checked={authority.assigned}
                      onCheckedChange={(checked) =>
                        handleAuthorityChange(role.groupName, authority.authorityName, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`auth-${role.groupName}-${authority.authorityName}`}
                      className="text-xs cursor-pointer flex-1 leading-relaxed"
                    >
                      {formatAuthorityName(authority.authorityName)}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default Authorities;
