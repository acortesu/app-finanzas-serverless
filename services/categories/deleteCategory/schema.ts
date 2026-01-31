export type DeleteCategoryQuery = {
  cascade: boolean
}

export function validateDeleteCategoryQuery(
  query: Record<string, string | undefined>
): DeleteCategoryQuery {
  return {
    cascade: query.cascade === 'true'
  }
}