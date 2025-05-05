export abstract class BuilderBase<T> {
    protected entity: T;
    protected buildQueue: (() => Promise<void>)[];

    /**
     * - Queue for functions to execute after build() is run,
     * - For example the creation of child entities might require the parent's id, 
     *   so we build the object, then after we create its children.
     * - Is called from build(), after all tasks in afterQueue are executed.
     */  
    protected afterQueue: (() => Promise<void>)[];

    constructor(private entityConstructor: new () => T){ this.reset(); }

    public reset(): this {
        this.entity = new this.entityConstructor();
        this.buildQueue = [];
        this.afterQueue = [];
        return this;
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

    protected setProp<K extends keyof T>(prop: K, value: T[K]): this {
        this.entity[prop] = value;
        return this;
    }

    protected setPropAfterBuild<K extends keyof T>(func: (entity: T, args: any) => Promise<any>, prop: K, entity: T, args: any): this {
        this.afterQueue.push(async () => {
            const result = await func(entity, args);
            if(!result){ 
                throw new Error('property value to set is null');
            }
            //(this.entity as any)[prop] = result;
            (this.entity as any)[prop] = Array.isArray(result) ? [...result] : result;
        });
        return this;
    }

    public async build(): Promise<T> {
        for(const task of this.buildQueue){
            await task();
        }
        
        if(this.afterQueue.length == 0){
            const result = this.entity;
            this.reset();
            return result;
        }

        return await this.ThenAfter();
    }

    public async ThenAfter(): Promise<T>{
        for(const task of this.afterQueue){
            await task();
        }
        const result = this.entity;
        this.reset();
        return result;
    }

    public updateEntity(toUpdate: T): this {
        this.entity = toUpdate;
        return this;
    }

    public abstract buildCreateDto(dto: any): Promise<T>;

    public abstract buildUpdateDto(toUpdate: T, dto: any): Promise<T>;
}