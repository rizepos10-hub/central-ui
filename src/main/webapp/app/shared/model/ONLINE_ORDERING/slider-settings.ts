import { buttonSettingsAlignment } from "../ENUMS/button-settings-alignment";
import { IAttachment } from "../attachment.model";

export interface ISliderSettings {
    image: IAttachment;
    text: string;
    buttonSetting: {
        text: string;
        color: string;
        alignment: buttonSettingsAlignment;
    }
}