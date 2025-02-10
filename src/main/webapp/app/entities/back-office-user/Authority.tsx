import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getRoles, updateRoles, changeEntityField } from "app/entities/back-office-user/user.reducer";
import { Checkbox } from "primereact/checkbox";
import { Label } from "reactstrap";
import { translate } from "react-jhipster";
import { IBackOfficeUser } from "app/shared/model/back-offic-user.model";

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

  return (
    <div className="d-flex flex-row flex-wrap justify-content-between">
      {roles?.map((role, index) => (
        <div key={`role-${index}-${role.groupName}`}>
          <h5>{role.groupName}</h5>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex flex-row gap-2">
              <Label htmlFor="role-checkbox">
                {role.assigned
                  ? translate("tempApp.deactivateRole")
                  : translate("tempApp.activateRole")}
              </Label>
              <Checkbox
                id="role-checkbox"
                value={role.assigned}
                checked={role.assigned}
                onChange={e => handleRoleChange(role.groupName, e.checked)}
              />
            </div>
            <div className="d-flex flex-row gap-2">
              <Label htmlFor="authorities-checkbox">
                {areAllRolesAuthoritiesAssigned(role.groupName)
                  ? translate("tempApp.uncheckAllAuthorities")
                  : translate("tempApp.checkAllAuthorities")}
              </Label>
              <Checkbox
                id="authorities-checkbox"
                checked={areAllRolesAuthoritiesAssigned(role.groupName)}
                onChange={e => handleAllRoleAuthoritiesChange(role.groupName, e.checked)}
              />
            </div>
          </div>
          <ul>
            {role.authorities?.map((authority, i) => (
              <li key={`authority-${i}-${role.groupName}-${authority.authorityName}`}>
                <input
                  type="checkbox"
                  checked={authority.assigned}
                  onChange={event =>
                    handleAuthorityChange(role.groupName, authority.authorityName, event.target.checked)
                  }
                />
                <label>{authority.authorityName}</label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Authorities;
