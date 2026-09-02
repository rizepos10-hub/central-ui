import { ILandingPageSettings, landingPageSettingsDefaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { createUiSettingsSectionReducer } from './section.reducer';

const apiUrl = 'api/online-ordering/settings/ui-settings/landing-pages';

const section = createUiSettingsSectionReducer<ILandingPageSettings>(
  'online-ordering-landing-page-settings',
  apiUrl,
  landingPageSettingsDefaultValue
);

export const getEntity = section.getEntity;
export const updateEntity = section.updateEntity;
export const changeEntityField = section.changeEntityField;
export const { reset } = section.actions;

export default section.reducer;
