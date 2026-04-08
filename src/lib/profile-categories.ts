export type ProfileCategory = {
  id: number;
  name: string;
  slug: string | null;
};

export function getProfileCategoryLabel(
  categories: ProfileCategory[],
  categoryId: number | null | undefined,
) {
  if (!categoryId) {
    return null;
  }

  return categories.find((category) => category.id === categoryId)?.name || null;
}
