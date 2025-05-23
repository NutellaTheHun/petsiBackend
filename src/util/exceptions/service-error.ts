export class ServiceError extends Error {
    constructor(
        public message: string,
        public context: {
            requestId?: string;
            entity?: string;
            operation?: 'create' | 'update' | 'delete' | 'find';
            statusCode?: number;
            meta?: any;
        } = {}
    ) {
        super(message);
    }
}