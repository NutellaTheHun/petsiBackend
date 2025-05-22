import { HttpStatus } from "@nestjs/common";
import { ObjectLiteral } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { AppHttpException } from "../util/exceptions/AppHttpException";
import { DTO_VALIDATION_FAIL, ENTITY_NOT_FOUND } from "../util/exceptions/error_constants";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { ValidatorBase } from "./validator-base";

export abstract class BuilderBase<T extends ObjectLiteral> {
    
    protected entity: T;
    protected buildQueue: (() => Promise<void>)[];

    constructor(
        private entityConstructor: new () => T,
        public builderPrefix: string,
        private readonly requestContextService: RequestContextService,
        private readonly logger: AppLogger,
        private readonly validator?: ValidatorBase<T>,
    ){ this.reset(); }

    protected abstract createEntity(dto: any): void;
    protected abstract updateEntity(dto: any): void;

    public async buildCreateDto(dto: any): Promise<T>{
        await this.validateCreateDto(dto);

        this.reset();

        this.createEntity(dto);

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: T, dto: any): Promise<T>{
        await this.validateUpdateDto(toUpdate.id, dto);

        this.reset();
        this.setEntity(toUpdate)

        this.updateEntity(dto);

        return await this.build();
    }

    /**
     * Throws AppHttpException if validation fails with error description
     */
    protected async validateCreateDto(dto: any): Promise<void> {
        const requestId = this.requestContextService.getRequestId();

        if (this.validator) {
            const error = await this.validator.validateCreate(dto);
            if(error){
                const err = new AppHttpException(
                    `${this.builderPrefix}: create dto validation failed`,
                    HttpStatus.BAD_REQUEST,
                    DTO_VALIDATION_FAIL,
                    { error }
                );

                this.logger.logError(
                    this.builderPrefix,
                    requestId,
                    'VALIDATE CREATE DTO',
                    err,
                    { requestId, error }
                );

                throw err;
            }
        }
    }

    protected async validateUpdateDto(id: number, dto: any): Promise<void> {
        const requestId = this.requestContextService.getRequestId();

        if (this.validator) {
            const error = await this.validator.validateUpdate(id, dto);
            if(error){
                const err = new AppHttpException(
                    `${this.builderPrefix}: ${error}`,
                    HttpStatus.BAD_REQUEST,
                    DTO_VALIDATION_FAIL,
                    { error }
                );

                this.logger.logError(
                    this.builderPrefix,
                    requestId,
                    'VALIDATE UPDATE DTO',
                    err,
                    { requestId, error, id }
                );

                throw err;
            }
        }
    }

    public reset(): this {
        this.entity = new this.entityConstructor();
        this.buildQueue = [];
        return this;
    }

    public setEntity(toUpdate: T): this {
        this.entity = toUpdate;
        return this;
    }

    public async build(): Promise<T> {
        for(const task of this.buildQueue){
            await task();
        }
        const result = this.entity;
        this.reset();
        return result;
    }

    protected setPropById<K extends keyof T>(
        
        findById: (id: number) => Promise<any>,
        prop: K,
        id: number,
    ): this {
        // Get requestId
        const requestId = this.requestContextService.getRequestId();

        this.buildQueue.push(async () => {
            const result = await findById(id);
            if(!result){ 
                const err = new AppHttpException(
                    `${this.builderPrefix}: ${prop.toString()} with id ${id} not found`,
                    HttpStatus.BAD_REQUEST,
                    ENTITY_NOT_FOUND,
                    { id }
                ); 

                this.logger.logError(
                    this.builderPrefix,
                    requestId,
                    'Set Prop By Id',
                    err,
                    { requestId }
                );

                throw err;
            }
            this.entity[prop] = result;
        });
        return this;
    }

    protected setPropsByIds<K extends keyof T>(
        findByIds: (ids: number[]) => Promise<T[K]>,
        prop: K,
        ids: number[],
    ): this {
        // Get requestId
        const requestId = this.requestContextService.getRequestId();

        this.buildQueue.push(async () => {
            const results = await findByIds(ids);
            if(!results){ 
                const err = new AppHttpException(
                    `${this.builderPrefix}: ${prop.toString()} with multiple ids not found`,
                    HttpStatus.BAD_REQUEST,
                    ENTITY_NOT_FOUND,
                    { ids }
                );

                this.logger.logError(
                    this.builderPrefix,
                    requestId,
                    'Set Prop By Ids',
                    err,
                    { requestId }
                );

                throw err;  
            }
            this.entity[prop] = results;
        });
        return this;
    }

    protected setPropByName<K extends keyof T>(
        findByName: (name: string) => Promise<any>,
        prop: K,
        name: string,
    ): this {
        this.buildQueue.push(async () => {
            const result = await findByName(name);
            if(!result){ 
                throw new AppHttpException(
                    `${this.builderPrefix}: ${prop.toString()} with name ${name} not found`,
                    HttpStatus.BAD_REQUEST,
                    ENTITY_NOT_FOUND,
                    { name }
                );
            };
            (this.entity as any)[prop] = result; 
        });
        return this;
    }

    protected setPropByVal<K extends keyof T>(prop: K, value: T[K]): this {
        this.entity[prop] = value;
        return this;
    }

    /**
     * Takes a function with 1 argument.
     * @param func 
     * @param prop 
     * @param arg 
     * @returns 
     */
    protected setPropByFn<K extends keyof T>(func: (arg: any) => Promise<any>, prop: K, arg: any): this {
        this.buildQueue.push(async () => {
            const result = await func(arg);
            if(!result){
                throw new Error('returned function value is null');
            }
            (this.entity as any)[prop] = result;
        });
        return this;
    }

    protected setPropByBuilder<K extends keyof T>(builderFunc: (entity: T, args: any) => Promise<any>, prop: K, entity: T, args: any): this {
        this.buildQueue.push(async () => {
            const result = await builderFunc(entity, args);
            (this.entity as any)[prop] = Array.isArray(result) ? [...result] : result;
        });
        return this;
    }
}