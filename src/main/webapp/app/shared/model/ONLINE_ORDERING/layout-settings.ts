import { buttonSettingsAlignment } from "../ENUMS/button-settings-alignment";
import { CategoryLayout } from "../ENUMS/categories-layout.model";
import { IItem } from "../ITEM/item.model";
import { IAttachment } from "../attachment.model";
import { ITerm } from "../term.model";
import { ISliderSettings } from "./slider-settings";

export interface ILayoutSettings {
    socialProfiles: {
        name: string;
        link: string;
        icon?: {
            id: string;
        }
    }[],
    retailCategorySetting: {
        categories: ITerm[],
        showImages: boolean,
        layout: CategoryLayout
    },
    restuarantCategorySetting: {
        categories: ITerm[],
        showImages: boolean,
        layout: CategoryLayout
    },
    sliderSettings: ISliderSettings[];
    productSetting: {
        FEATURED: {
            items: IItem[],
            showImages: boolean,
            layout: CategoryLayout
        }
    }
}

export const defaultLayoutValue: Readonly<ILayoutSettings> = {
    socialProfiles: [],
    retailCategorySetting: {
        categories: [],
        showImages: false,
        layout: CategoryLayout.layoutOne
    },
    restuarantCategorySetting: {
        categories: [],
        showImages: false,
        layout: CategoryLayout.layoutOne
    },
    sliderSettings: [],
    productSetting: {
        FEATURED: {
            items: [],
            showImages: false,
            layout: CategoryLayout.layoutOne
        }
    }
}