export enum SelectedLayoutEnum {
    LAYOUT_GABRIEL_PIZZA = "LAYOUT_GABRIEL_PIZZA",
    LAYOUT_PITA_LAND = "LAYOUT_PITA_LAND",
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
    src: string;
    alt: string;
    title1: string;
    title2: string;
    description: string;
    cta: string;
}

export interface IFeaturedItems {
    order: number;
    leftColumn: {
        title: string;
        subtitle: string;
        image: string;
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
        image: string;
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
        cta: string;
    };
    body: {
        carousel: ICarouselItem[];
        featuredItems: IFeaturedItems;
        featuredCategories: IFeaturedCategories;
    };
    footer: {
        title: string;
        cta: string;
    };
}

export interface ILayoutGabrielPizza {
    colorSetting: IColorSetting;
    sections: ISections;
}


export interface ILayouts {
    selectedLayout: SelectedLayoutEnum;
    [SelectedLayoutEnum.LAYOUT_GABRIEL_PIZZA]: ILayoutGabrielPizza;
}
