export interface IQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  [key: string]: unknown;
}
 
export interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const buildPaginationOptions = (query: IQuery): IPaginationResult => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? String(query.sortBy) : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
 
  return { page, limit, skip, sortBy, sortOrder };
};
