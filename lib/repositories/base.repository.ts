import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SupabaseClient } from '@supabase/supabase-js';
import { PaginationParams, PaginatedResponse } from '@/lib/types';

export interface IRepository<T> {
  findAll(filters?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(filters: any): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected tableName: string;
  protected useServiceRole: boolean;

  constructor(tableName: string, useServiceRole = false) {
    this.tableName = tableName;
    this.useServiceRole = useServiceRole;
  }

  protected async getClient(): Promise<SupabaseClient> {
    if (this.useServiceRole) {
      return createServiceClient();
    }
    return createClient();
  }

  async findAll(filters?: any): Promise<T[]> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*');

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return data as T[];
  }

  async findPaginated(
    filters?: any,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const client = await this.getClient();
    
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const offset = (page - 1) * pageSize;

    let query = client.from(this.tableName).select('*', { count: 'exact' });

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    if (pagination?.sortBy) {
      query = query.order(pagination.sortBy, { 
        ascending: pagination.sortOrder === 'asc' 
      });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch paginated ${this.tableName}: ${error.message}`);
    }

    return {
      data: data as T[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async findById(id: string): Promise<T | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch ${this.tableName} by id: ${error.message}`);
    }

    return data as T | null;
  }

  async findOne(filters: any): Promise<T | null> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*');

    query = this.applyFilters(query, filters);

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch single ${this.tableName}: ${error.message}`);
    }

    return data as T | null;
  }

  async create(data: Partial<T>): Promise<T> {
    const client = await this.getClient();
    
    // Clean up empty string UUIDs - convert to null
    const cleanedData = this.cleanEmptyUUIDs(data);
    
    const { data: created, error } = await client
      .from(this.tableName)
      .insert(cleanedData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return created as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const client = await this.getClient();
    
    // Clean up empty string UUIDs in all records
    const cleanedData = data.map(item => this.cleanEmptyUUIDs(item));
    
    const { data: created, error } = await client
      .from(this.tableName)
      .insert(cleanedData)
      .select();

    if (error) {
      throw new Error(`Failed to create multiple ${this.tableName}: ${error.message}`);
    }

    return created as T[];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const client = await this.getClient();
    
    // Clean up empty string UUIDs - convert to null
    const cleanedData = this.cleanEmptyUUIDs(data);
    
    const { data: updated, error } = await client
      .from(this.tableName)
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return updated as T;
  }
  
  /**
   * Clean empty UUID strings and convert them to null
   * This prevents "invalid input syntax for type uuid" errors
   */
  protected cleanEmptyUUIDs(data: any): any {
    const cleaned = { ...data };
    const uuidFields = ['device_id', 'customer_device_id', 'customer_id', 'assigned_to', 'created_by', 'converted_to_ticket_id'];
    
    for (const field of uuidFields) {
      if (field in cleaned && (cleaned[field] === '' || cleaned[field] === undefined)) {
        cleaned[field] = null;
      }
    }
    
    return cleaned;
  }

  async updateMany(filters: any, data: Partial<T>): Promise<T[]> {
    const client = await this.getClient();
    
    // Clean up empty string UUIDs - convert to null
    const cleanedData = this.cleanEmptyUUIDs(data);
    
    let query = client.from(this.tableName).update(cleanedData);

    query = this.applyFilters(query, filters);

    const { data: updated, error } = await query.select();

    if (error) {
      throw new Error(`Failed to update multiple ${this.tableName}: ${error.message}`);
    }

    return updated as T[];
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  async deleteMany(filters: any): Promise<boolean> {
    const client = await this.getClient();
    let query = client.from(this.tableName).delete();

    query = this.applyFilters(query, filters);

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete multiple ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  async count(filters?: any): Promise<number> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*', { count: 'exact', head: true });

    if (filters) {
      query = this.applyFilters(query, filters);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.count(filters);
    return count > 0;
  }

  protected applyFilters(query: any, filters: any): any {
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value.hasOwnProperty('operator')) {
        const { operator, value: filterValue } = value;
        switch (operator) {
          case 'eq':
            query = query.eq(key, filterValue);
            break;
          case 'neq':
            query = query.neq(key, filterValue);
            break;
          case 'lt':
            query = query.lt(key, filterValue);
            break;
          case 'lte':
            query = query.lte(key, filterValue);
            break;
          case 'gt':
            query = query.gt(key, filterValue);
            break;
          case 'gte':
            query = query.gte(key, filterValue);
            break;
          case 'like':
            query = query.like(key, filterValue);
            break;
          case 'ilike':
            query = query.ilike(key, filterValue);
            break;
          case 'contains':
            query = query.contains(key, filterValue);
            break;
          case 'in':
            query = query.in(key, filterValue);
            break;
          default:
            query = query.eq(key, filterValue);
        }
      } else {
        query = query.eq(key, value);
      }
    });

    return query;
  }
}