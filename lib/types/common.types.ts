/**
 * Common types used across the application
 * These are not generated from the database schema
 */

/**
 * Filter operators for database queries
 */
export enum FilterOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  LIKE = 'like',
  ILIKE = 'ilike',
  IN = 'in',
  IS = 'is',
  NOT = 'not'
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Common filter interface
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  order: SortOrder;
}