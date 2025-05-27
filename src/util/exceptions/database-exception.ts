import { DatabaseError } from "./database-error";

export class DatabaseException extends Error {
    public readonly error: DatabaseError;

    constructor(error: DatabaseError, message = 'Database error occured') {
        super(message);
        this.name = 'DatabaseException';
        this.error = error;
    }
}