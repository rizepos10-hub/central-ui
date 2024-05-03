import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getRoles, updateRoles } from "app/entities/back-office-user/user.reducer";
import { Checkbox } from "primereact/checkbox";

function Authorities({id}) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(state => state.user.roles?.['groups']);

  useEffect(() => {
    if(id){
      dispatch(getRoles(id));
    }
  }, [id]);


  const handleRoleChange = (groupName, newValue) => {
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
          assigned: newValue,
        }));

        return { ...role, authorities: updatedRoleAuthorities };
      }

      const updatedAuthorities = role.authorities.map(authority => {
        const associatedRoles = authorityMap.get(authority.authorityName);

        if (associatedRoles.includes(groupName)) {
          return { ...authority, assigned: newValue };
        }

        return authority;
      });

      return { ...role, authorities: updatedAuthorities };
    });

    dispatch(updateRoles(updatedRoles));
  };

  console.log(roles, 'rolesssssss')


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

  const isRoleSelected = role => {
    console.log(role, 'rolerole')
    return role.authorities?.every(authority => authority.assigned);
  };

  return (
    <div className={'d-flex flex-row flex-wrap justify-content-between'}>
      {roles?.map((role, index) => {
        return (
          <div key={`role-${index}-${role.groupName}`}>
            <div className={'d-flex flex-row gap-1 border border-light'}>
              <Checkbox
                className={"mt-3"}
                checked={isRoleSelected(role)}
                onChange={event => handleRoleChange(role.groupName, event.checked)}
              />
              <h5>{role.groupName}</h5>
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
