import { ObjectLiteral } from "typeorm";
import { ValidatorBase } from "./validator-base";
import { BadRequestException } from "@nestjs/common";

export abstract class BuilderBase<T extends ObjectLiteral> {
    protected entity: T;
    protected buildQueue: (() => Promise<void>)[];

    constructor(
        private entityConstructor: new () => T,
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
        await this.validateUpdateDto(dto);

        this.reset();
        this.setEntity(toUpdate)

        this.updateEntity(dto);

        return await this.build();
    }

    protected async validateCreateDto(dto: any): Promise<void> {
        if (this.validator) {
            const error = await this.validator.validateCreate(dto);
            if (error) throw new BadRequestException(error);
        }
    }

    protected async validateUpdateDto(dto: any): Promise<void> {
        if (this.validator) {
            const error = await this.validator.validateUpdate(dto);
            if (error) throw new BadRequestException(error);
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
        this.buildQueue.push(async () => {
            const result = await findById(id);
            if(!result){ 
                throw new Error(`Entity not found for ID: ${id}`); 
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
        this.buildQueue.push(async () => {
            const results = await findByIds(ids);
            if(!results){ 
                throw new Error(`Entity not found within IDs: ${ids}`); 
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
                throw new Error(`Entity not found for name: ${name}`)
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
                throw new Error('return value is null');
            }
            (this.entity as any)[prop] = result;
        });
        return this;
    }

    protected setPropByBuilder<K extends keyof T>(func: (entity: T, args: any) => Promise<any>, prop: K, entity: T, args: any): this {
        this.buildQueue.push(async () => {
            const result = await func(entity, args);
            if(!result){ 
                throw new Error('property value to set is null');
            }
            (this.entity as any)[prop] = Array.isArray(result) ? [...result] : result;
        });
        return this;
    }
}