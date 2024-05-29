import { buttonSettingsAlignment } from "../ENUMS/button-settings-alignment";
import { Layout } from "../ENUMS/layout.model";
import { IItem } from "../ITEM/item.model";
import { IAttachment } from "../attachment.model";
import { ITerm } from "../term.model";
import { ISliderSettings } from "./slider-settings";
import { ISocialProfile } from "./social-profile";

export interface ILayoutSettings {
    socialProfiles: {
        FACEBOOK: ISocialProfile,
        INSTAGRAM: ISocialProfile,
        TWITTER: ISocialProfile,
        TIKTOK: ISocialProfile,
        YOUTUBE: ISocialProfile,
        LINKEDIN: ISocialProfile,
    },
    retailCategorySetting: {
        categories: ITerm[],
        showImages: boolean,
        layout: Layout
    },
    restuarantCategorySetting: {
        categories: ITerm[],
        showImages: boolean,
        layout: Layout
    },
    sliderSettings: ISliderSettings[];
    productSetting: {
        FEATURED: {
            items: IItem[],
            showImages: boolean,
            layout: Layout
        }
    }
}

export const defaultLayoutValue: Readonly<ILayoutSettings> = {
    socialProfiles: {
        FACEBOOK: {
            name: "Facebook",
            url: ""
        },
        INSTAGRAM: {
            name: "Instagram",
            url: ""
        },
        TWITTER: {
            name: "Twitter",
            url: ""
        },
        TIKTOK: {
            name: "Tiktok",
            url: ""
        },
        YOUTUBE: {
            name: "Youtube",
            url: ""
        },
        LINKEDIN: {
            name: "Linkedin",
            url: ""
        }

    },
    retailCategorySetting: {
        categories: [],
        showImages: false,
        layout: Layout.layoutOne
    },
    restuarantCategorySetting: {
        categories: [],
        showImages: false,
        layout: Layout.layoutOne
    },
    sliderSettings: [],
    productSetting: {
        FEATURED: {
            items: [],
            showImages: false,
            layout: Layout.layoutOne
        }
    }
}