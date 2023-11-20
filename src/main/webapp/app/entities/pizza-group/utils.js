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




export const addNewOption = async ( selectedGroupIndex, dispatch, pizzaDefinition, group, order, type) => {

  const newToppingOption = {
    name: "default name",
    desc: 'default description',
    definitionType: type,
    affectOtherOption: false,
    required: false,
    icon: null,
    builderImage: null,
    order,
    dependsOn: [
    ],
    modifiers: [
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_AREA",
        defaultSelected: false,
        visibleOn: null,
        label: "LEFT"
      },
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_AREA",
        defaultSelected: false,
        visibleOn: null,
        label: "RIGHT"
      },
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_AREA",
        defaultSelected: false,
        visibleOn: null,
        label: "FULL"
      },
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_SIZE",
        defaultSelected: false,
        visibleOn: null,
        label: "0.5x"
      },
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_SIZE",
        defaultSelected: false,
        visibleOn: null,
        label: "1x"
      },
      {
        defaultPrice: 0.0,
        modifiedPrices: [
        ],
        definitionType: "TOPPING_SIZE",
        defaultSelected: false,
        visibleOn: null,
        label: "2x"
      }
    ]
  }
  const newBaseOption = {
    affectOtherOption: false,
    name: 'default name',
    desc: 'default description',
    order,
    icon: null,
    builderImage: null,
    definitionType: type,
    modifiers: [],
    dependsOn: [],
  };


  const res  = await dispatch(createDefinitionGroupOption({ option: type === "BASE" ? newBaseOption : newToppingOption, id: pizzaDefinition.id, groupId: group.id }))

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




export const areObjectsEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!areObjectsEqual(val1, val2)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
};



export const generateDependencyOptions = (dependsOn, allOptionsExceptCurrent) => {
  const allDependencyOptions = [];

  dependsOn.forEach((depOption) => {
    const dependencyOptions = allOptionsExceptCurrent
      .filter((opt) => depOption === opt.id)
      .map((opt) => ({...opt, label: opt.name, value: opt.id }));

    allDependencyOptions.push(...dependencyOptions);
  });

  return allDependencyOptions;
};


export const getModifierNames = (optionsSelected,allOptionsExceptCurrent) => {
  const modifierNamesMap = {};

  Object.keys(optionsSelected).forEach((optionId) => {
    const modifierIds = optionsSelected[optionId];
    const option = allOptionsExceptCurrent.find((opt) => opt.id === optionId);

    if (option) {
      modifierIds.forEach((modifierId) => {
        const modifier = option.modifiers.find((mod) => mod.id === modifierId);
        if (modifier) {
          modifierNamesMap[modifierId] = modifier.label;
        }
      });
    }
  });

  return modifierNamesMap;
};
