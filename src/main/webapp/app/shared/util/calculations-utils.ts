import React from "react"
import { IDiscount } from "../model/discount.model"
import { IItem } from "../model/ITEM/item.model"
import { IBranchVariantDetails, IVariableItemVariant } from "../model/ITEM/retail/variable-item.model"
import { IProfileGroup } from "../model/TAX/profile-group.model"
import { ITax } from "../model/TAX/tax.model"

const calculateDiscount = (discounts: IDiscount[], price: number) => {
    let discountedPrice = price
    discounts.forEach((discount) => {
        const discountType: "FLAT" | "PERCENTAGE" = discount.type
        const discountValue: number = discount.value
        if (discountType === "FLAT") {
            discountedPrice = price - discountValue
        }
    })

    discounts.forEach((discount) => {
        const discountType: "FLAT" | "PERCENTAGE" = discount.type
        const discountValue: number = discount.value
        if (discountType === "PERCENTAGE") {
            discountedPrice = discountedPrice - (discountedPrice * discountValue / 100)
        }
    })

    return discountedPrice
}

export const getPriceAfterDiscount = (
    price: number,
    discounts: IDiscount[],
    itemDiscounts?: IDiscount[]
): number => {
    if (discounts.length > 0) {
        return calculateDiscount(discounts, price)
    } else {
        if (itemDiscounts && itemDiscounts.length > 0) {
            return calculateDiscount(itemDiscounts, price)
        }
    }
    return price
}

export const getPriceAfterTax = (
    price: number,
    accountingGroups: IProfileGroup[]
) => {
    let taxPrice = 0
    const uniqueTaxRates = new Map<string, ITax>();

    accountingGroups?.forEach((group) => {
        group.profiles?.forEach((profile) => {
            //              EXCLAMATION MARK HERE
            //                   |||
            const isRuleApplied = !profile.rules.some((rule) => {
                if (rule.type === "ITEM_UNIT_PRICE") {
                    if (price >= Number(rule.min) && price <= Number(rule.max)) {
                        return false
                    }
                }
                if (rule.type === "DATES") {
                    const startDate = new Date(rule.min)
                    const endDate = new Date(rule.max)
                    const currentDate = new Date()
                    return !(currentDate >= startDate && currentDate <= endDate)
                }
            })

            if (isRuleApplied) {
                uniqueTaxRates.set(profile.taxRate.id, profile.taxRate)
            }
        })
    })

    uniqueTaxRates.forEach((taxRate) => {
        taxPrice += ((taxRate.value / 100) * price)
    })

    return taxPrice + price
}

export const getPriceForBranch = (
    price: number,
    branchDetails: IBranchVariantDetails | null,
    branchId: string,
    salePrice: number | null
): number => {
    const branch = branchDetails[branchId];
    if (branch?.salePrice != null) return branch.salePrice;
    if (salePrice != null) return salePrice;
    if (branch?.price != null) return branch.price;
    return price;
}

export const salePrice = (
    variant: IVariableItemVariant,
    branchId: string,
    amount = 1,
): JSX.Element | undefined => {
    let salePrice = undefined

    salePrice = variant.branchVariantDetails?.[branchId]?.price || variant.price || undefined

    if (salePrice) {
        const discountedPrice = getPriceAfterDiscount(salePrice, variant?.discounts)

        salePrice = discountedPrice * amount
    }

    return salePrice ? salePrice : undefined
}


export const getFinalPrice = ({
    variantItem,
    branchId,
    pizzaPrice,
    item
}: {
    branchId?: string
    variantItem?: IVariableItemVariant
    pizzaPrice?: number
    item?: IItem,
}) => {
    let finalPrice = 0
    if (branchId && variantItem) {
        finalPrice = getPriceForBranch(
            variantItem.price,
            variantItem.branchVariantDetails,
            branchId,
            variantItem.salePrice
        )
    }
    if (variantItem) {
        finalPrice = getPriceAfterDiscount(pizzaPrice ? pizzaPrice : finalPrice, variantItem.discounts, item?.discounts)
    }

    // if (item && item.accountingGroups) {
    //   finalPrice = getPriceAfterTax(finalPrice, item.accountingGroups)
    // }
    return finalPrice
}