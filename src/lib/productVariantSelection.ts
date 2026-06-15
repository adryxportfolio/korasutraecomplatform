type VariantOption = {
  name: string;
  value: string;
};

type VariantEdge<T> = {
  node: T & {
    selectedOptions: VariantOption[];
  };
};

export function findExactVariant<T>(
  variants: VariantEdge<T>[],
  options: Record<string, string>,
  requiredOptionNames: string[],
) {
  if (requiredOptionNames.some((name) => !options[name])) return null;

  return variants.find(({ node }) => (
    requiredOptionNames.every((name) => (
      node.selectedOptions.some((option) => (
        option.name === name && option.value === options[name]
      ))
    ))
  ))?.node ?? null;
}
