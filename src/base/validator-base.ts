import { ObjectLiteral, Repository } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { ValidationError } from "../util/exceptions/validation-error";
import { ValidationExceptionHandler } from "../util/exceptions/validation-exception.handler";
import { ValidatorHelper } from "../util/validatator-helper.util";
import { ValidationException } from "../util/exceptions/validation-exception";

export abstract class ValidatorBase<T extends ObjectLiteral> {

    protected errors: ValidationError[] = [];
    protected helper = new ValidatorHelper();
    private exceptionHandler: ValidationExceptionHandler

    constructor(
        private readonly entityRepo: Repository<T>,
        private readonly validationPrefix: string,
        private readonly requestContextService: RequestContextService,
        private readonly logger: AppLogger,
    ) { this.exceptionHandler = new ValidationExceptionHandler(logger) }

    public abstract validateCreate(dto: any,): Promise<void>;
    public abstract validateUpdate(id: number, dto: any): Promise<void>;

    protected addError(error: ValidationError) {
        this.errors.push(error);
    }

    /**
     * Throws {@link ValidationException}
     */
    protected throwIfErrors(): void {
        if (this.errors.length > 0) {
            const contextId = this.requestContextService.getRequestId();
            const err = this.exceptionHandler.handle(this.errors, this.validationPrefix, contextId);
            this.reset();
            throw err;
        }
    }

    private reset() {
        this.errors = [];
    }
}