import { IAttachment } from "../../attachment.model";
import { ILayoutSettings } from "../layout-settings";

export enum SelectedLayoutEnum {
    LAYOUT_ONE = "LAYOUT_ONE",
    LAYOUT_TWO = "LAYOUT_TWO",
    LAYOUT_DEFAULT = "LAYOUT_DEFAULT"
}

export interface IColorSetting {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    muted: string;
}

export interface ICarouselItem {
    order: number;
    image: IAttachment;
    altText: string;
    primaryTitle: string;
    secondaryTitle: string;
    description: string;
    callToAction: string;
}

export interface IFeaturedItems {
    order: number;
    leftColumn: {
        title: string;
        subtitle: string;
        image: IAttachment;
    };
    rightColumn: {
        title: string;
        subtitle: string;
        callToAction: string;
        items: Record<string, any>[];
        image: IAttachment;
    };
}

export interface IFeaturedCategories {
    order: number;
    leftColumn: {
        title: string;
        categories: Record<string, any>[];
        image: IAttachment;
    };
    rightColumn: {
        title: string;
        subtitle: string;
        descriptionTitle: string;
        description: string;
        image: IAttachment;
    };
}

export interface ISections {
    header: {
        title: string;
        callToAction: string;
    };
    body: {
        carousel: ICarouselItem[];
        featuredItems: IFeaturedItems;
        featuredCategories: IFeaturedCategories;
    };
    footer: {
        title: string;
        callToAction: string;
    };
}

export interface ILayoutOne {
    colorSettings: IColorSetting;
    sections: ISections;
}


export interface ILayouts {
    selectedLayout: SelectedLayoutEnum;
    [SelectedLayoutEnum.LAYOUT_ONE]: ILayoutOne;
    [SelectedLayoutEnum.LAYOUT_DEFAULT]: ILayoutSettings;
}
