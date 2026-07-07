import { checkoutOrderingSettingsDefaultValue, ICheckoutOrderingSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';

const apiUrl = 'api/online-ordering/settings/ui-settings/checkout-ordering';

const section = createUiSettingsSectionReducer<ICheckoutOrderingSettings>(
  'online-ordering-checkout-ordering-settings',
  apiUrl,
  checkoutOrderingSettingsDefaultValue
);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;
export default section.reducer;
