import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getRoles, updateRoles } from "app/entities/back-office-user/user.reducer";
import { Checkbox } from "primereact/checkbox";
import { Label } from "reactstrap";
import { translate } from "react-jhipster";






function Authorities({id}) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(state => state.user.roles?.['groups']);


  useEffect(() => {
    if(id){
      dispatch(getRoles(id));
    }
  }, [id]);



    const handleRoleChange = (groupName, newValue) => {

      const updatedRoles = roles.map(role => {
        if (role.groupName === groupName) {
          return {
            ...role,
            assigned: newValue,
          };
        }
        return role
      });

      dispatch(updateRoles(updatedRoles));
    };

    const areAllRolesAuthoritiesAssigned = (groupName) => {
     const targetedRole = roles.find(role => role.groupName === groupName);
     return targetedRole.authorities.every(authority => authority.assigned);
    }

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
          const updatedRoleAuthorities = role.authorities.map(authority => ({
            ...authority,
            assigned: checked,
          }));

          return {
            ...role,
            authorities: updatedRoleAuthorities,
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

        return {
          ...role,
          authorities: updatedAuthorities,
        };
      });


      dispatch(updateRoles(updatedRoles));
    }





  const handleAuthorityChange = (authorityName, newValue) => {
    const updatedAuthorities = roles.map(role => {
      const updatedRoleAuthorities = role.authorities.map(authority => {
        if (authority.authorityName === authorityName) {
          return { ...authority, assigned: newValue };
        }
        return authority;
      });
      return { ...role, authorities: updatedRoleAuthorities };
    });

    dispatch(updateRoles(updatedAuthorities));
  };

  return (
    <div className={'d-flex flex-row flex-wrap justify-content-between'}>
      {roles?.map((role, index) => {
        return (
          <div key={`role-${index}-${role.groupName}`}>
            <h5>{role.groupName}</h5>
            <div className={'d-flex flex-column gap-2'}>
              <div className={'d-flex flex-row gap-2'}>
                <Label htmlFor="role-checkbox" >
                  {role.assigned ? `${translate("tempApp.deactivateRole")}` : `${translate("tempApp.activateRole")}`}
                </Label>
                <Checkbox
                  id="role-checkbox"
                  value={role.assigned}
                  checked={role.assigned}
                  onChange={event => handleRoleChange(role.groupName, event.checked)}
                />
              </div>

              <div className={'d-flex flex-row gap-2'}>
                <Label htmlFor="authorities-checkbox">
                  {areAllRolesAuthoritiesAssigned(role.groupName) ? `${translate("tempApp.uncheckAllAuthorities")}` : `${translate("tempApp.checkAllAuthorities")}` }
                </Label>
                <Checkbox
                  id="authorities-checkbox"
                  checked={areAllRolesAuthoritiesAssigned(role.groupName)}
                  onChange={event => handleAllRoleAuthoritiesChange(role.groupName, event.checked)}
                />
              </div>
            </div>
            <ul>
              {role.authorities?.map((authority, i) => (
                <li key={`authority-${i}-${role.groupName}-${authority.authorityName}`}>
                  <input
                    type="checkbox"
                    checked={authority.assigned}
                    onChange={event => handleAuthorityChange(authority.authorityName, event.target.checked)}
                  />
                  <label>{authority.authorityName}</label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default Authorities;
