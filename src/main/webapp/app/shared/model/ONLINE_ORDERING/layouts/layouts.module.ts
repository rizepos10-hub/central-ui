import { IAttachment } from "../../attachment.model";

export enum SelectedLayoutEnum {
    LAYOUT_GABRIEL_PIZZA = "LAYOUT_GABRIEL_PIZZA",
    LAYOUT_PITA_LAND = "LAYOUT_PITA_LAND",
}

export interface IColorSetting {
    backgroundColor: string;
    footerColor: string;
    primaryTextColor: string;
    primaryForegroundColor: string;
    secondaryTextColor: string;
    mutedTextColor: string;
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
        cta: string;
        items: Record<string, any>[];
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

export interface ILayoutGabrielPizza {
    colorSettings: IColorSetting;
    sections: ISections;
}


export interface ILayouts {
    selectedLayout: SelectedLayoutEnum;
    [SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA]: ILayoutGabrielPizza;
}
