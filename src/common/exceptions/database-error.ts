import { QueryFailedError } from 'typeorm';
import { DatabaseException } from './database-exception';

export enum DatabaseErrorCode {
    CONSTRAINT = 'CONSTRAINT',
    NOT_FOUND = 'NOT_FOUND',
    CONNECTION = 'CONNECTION',
    UNKNOWN = 'UNKNOWN',
}

// https://www.postgresql.org/docs/current/errcodes-appendix.html

/** The node-postgres error fields the app reads off `QueryFailedError.driverError`. */
export interface PgDriverError {
    code?: string;
    message?: string;
    table?: string;
    constraint?: string;
    detail?: string;
}

/** The Postgres driver error behind a TypeORM query failure, if `error` is one. */
export function pgDriverErrorOf(error: unknown): PgDriverError | undefined {
    return error instanceof QueryFailedError
        ? (error.driverError as PgDriverError)
        : undefined;
}

export class DatabaseError extends Error {
    constructor(
        public readonly code: DatabaseErrorCode,
        public readonly message: string,
        public readonly details?: Record<string, unknown> | null,
        public readonly originalError?: unknown,
    ) {
        super(message);
        this.name = 'DatabaseError';
    }

    static fromTypeOrmError(error: unknown): DatabaseException {
        let dbError: DatabaseError;

        if (error instanceof QueryFailedError) {
            const pgError = error.driverError as PgDriverError;

            if (pgError?.code === '23505') {
                dbError = new DatabaseError(
                    DatabaseErrorCode.CONSTRAINT,
                    'Unique constraint violation',
                    {
                        table: pgError.table,
                        constraint: pgError.constraint,
                        detail: pgError.detail,
                    },
                    error,
                );
            } else if (pgError?.code === '23503') {
                dbError = new DatabaseError(
                    DatabaseErrorCode.CONSTRAINT,
                    'Foreign key constraint failed',
                    {
                        table: pgError.table,
                        constraint: pgError.constraint,
                        detail: pgError.detail,
                    },
                    error,
                );
            } else {
                dbError = new DatabaseError(
                    DatabaseErrorCode.UNKNOWN,
                    'Unknown query failure',
                    {
                        message: pgError.message,
                        code: pgError.code,
                        ...pgError,
                    },
                    error,
                );
            }
        } else if (
            error instanceof Error &&
            error.name === 'EntityNotFoundError'
        ) {
            dbError = new DatabaseError(
                DatabaseErrorCode.NOT_FOUND,
                error.message,
                null,
                error,
            );
        } else {
            dbError = new DatabaseError(
                DatabaseErrorCode.UNKNOWN,
                error instanceof Error ? error.message : String(error),
                null,
                error,
            );
        }

        return new DatabaseException(dbError, dbError.message);
    }
}
