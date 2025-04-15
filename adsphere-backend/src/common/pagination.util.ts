import { Model, FilterQuery } from 'mongoose';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export async function paginate<T>(
  model: Model<T>,
  query: FilterQuery<T> = {},
  page = 1,
  limit = 20,
  sort: Record<string, 1 | -1> = { updatedAt: -1 },
  select?: string,
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select ?? ""),
    model.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    pageSize: limit
  };
}



