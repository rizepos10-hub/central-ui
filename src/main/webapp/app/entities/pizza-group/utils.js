import {createEntity, getEntityByType} from "app/entities/item-definitions/item-definitions.reducer";

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

