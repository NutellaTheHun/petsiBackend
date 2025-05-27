export class PaginatedResult<T> {
    items: T[];
    nextCursor?: string;
}