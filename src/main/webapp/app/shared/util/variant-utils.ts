export const formatVariant = (variantName: any, attributeValues: any) => {
    const baseName = variantName?.trim();
    // @ts-expect-error -- unknown type
    const attrNames = Object.values(attributeValues || {}).map(attr => attr?.name?.trim() || "");
    // Sort attribute names alphabetically so "1kg" comes before "Small"
    attrNames.sort((a, b) => a?.localeCompare(b));
    return [baseName, ...attrNames]?.join(" / ");
};