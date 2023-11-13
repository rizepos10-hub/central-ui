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
  const modifiers = [];

  if (currentOption && currentOption.modifiers) {
    currentOption.modifiers.forEach(currentModifier => {
      modifiers.push(currentModifier);

      if (currentOption.dependsOn && currentOption.dependsOn.length > 0) {
        currentOption.dependsOn.forEach(dependencyId => {
          const dependencyOption = allOptionsExceptCurrent.find(opt => opt.id === dependencyId);

          if (dependencyOption && dependencyOption.modifiers) {
            dependencyOption.modifiers.forEach(dependentModifier => {
              const combinedModifier = {
                ...currentModifier,
                label: `${currentModifier.label} ${dependentModifier.label}`
              };
              modifiers.push(combinedModifier);
            });
          }
        });
      }
    });
  }

  return modifiers;
};
