import {
  createDefinitionGroup,
  createDefinitionGroupOption,
  createEntity,
  getEntityByType
} from "app/entities/item-definitions/item-definitions.reducer";

export const createDefinitions = (dispatch) => {

  const pizzaDefinition = {
    name: 'Pizza Definitions',
    desc: 'Pizza Definitions',
    definitionType: 'PIZZA',
  };
    dispatch(createEntity(pizzaDefinition));
};

export const checkAndFetchPizzaDefinition = (dispatch) => {
  return dispatch(getEntityByType({ type: 'PIZZA' }))
    .then((response) => {
      const pizzaItem = response?.payload?.data?.find(item => item.definitionType === "PIZZA");
      if (!pizzaItem) {
        createDefinitions(dispatch);
      }})
};



export const addNewRequiredOption = async ( selectedGroupIndex, dispatch, pizzaDefinition, group) => {
  const newOption = {
    affectOtherOption: false,
    name: 'default name',
    desc: 'default description',
    order: null,
    definitionType: "BASE",
    modifiers: [],
    dependsOn: [],
  };

  const res  = await dispatch(createDefinitionGroupOption({ option: newOption, id: pizzaDefinition.id, groupId: group.id }))

  const updatedGroups = res?.payload?.data?.groups;

  return updatedGroups;
};



// To delete a Group from item definition
export const deleteGroup = (prevGroups, selectedGroupIndex) => {
  if (selectedGroupIndex !== null) {
    const updatedGroups = [...prevGroups];
    updatedGroups.splice(selectedGroupIndex, 1);
    return updatedGroups;
  }
  return prevGroups;
};


// empty group values
export const emptyGroupValues = () => ({
  name: '',
  desc: '',
  additionalDesc: '',
  requiredOptions: [],
  optionalOptions: [],
});


// Combine modifiers for the options that have depends on modifiers
export const combineModifiers = (currentOption, allOptionsExceptCurrent) => {
  const combinedModifiers = [];

  if (currentOption && currentOption.modifiers) {
    currentOption.modifiers.forEach((currentModifier) => {
      const combinedModifier = {
        ...currentModifier,
        modifiedPrices: [...currentModifier?.modifiedPrices || []],
      };

      if (currentOption.dependsOn && currentOption.dependsOn.length > 0) {
        currentOption.dependsOn.forEach((dependencyId) => {
          const dependencyOption = allOptionsExceptCurrent.find((opt) => opt.id === dependencyId);

          if (dependencyOption && dependencyOption.modifiers) {
            dependencyOption.modifiers.forEach((dependentModifier) => {
              const combinationLabel = `${currentModifier.label} ${dependentModifier.label}`;
              const optionsSelected = {
                [dependencyOption.id]: [dependentModifier.id],
              };
              const existingCombinedModifierItem = combinedModifier.modifiedPrices.find(
                (existingModifierItem) => deepEqual(existingModifierItem.optionsSelected, optionsSelected)
              );

              if (!existingCombinedModifierItem) {
                const dependentCombinedModifier = {
                  optionsSelected,
                  price: 0,
                  label: combinationLabel,
                };
                combinedModifier.modifiedPrices.push(dependentCombinedModifier);
              } else {
                const updatedModifierItem = {
                  ...existingCombinedModifierItem,
                  label: combinationLabel,
                };
                combinedModifier.modifiedPrices = combinedModifier.modifiedPrices.map((modifierItem) =>
                  deepEqual(modifierItem.optionsSelected,existingCombinedModifierItem.optionsSelected) ? updatedModifierItem : modifierItem
                );
              }
            });
          }
        });
      }

      combinedModifiers.push(combinedModifier);

    });
  }



  return combinedModifiers;
};





const deepEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!deepEqual(val1, val2)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
};
