export class BuilderBase<T> {
    protected entity: T;
    protected taskQueue: (() => Promise<void>)[];

    constructor(private entityConstructor: new () => T){ this.reset(); }

    public reset(): this {
        this.entity = new this.entityConstructor();
        this.taskQueue = [];
        return this;
    }

    protected setPropById<K extends keyof T>(
        //service: ServiceBase<any>,
        findById: (id: number) => Promise<any>,
        prop: K,
        id: number,
    ): this {
        this.taskQueue.push(async () => {
            const result = await findById(id);
            if(!result){ 
                throw new Error(`Entity not found for ID: ${id}`); 
            }
            this.entity[prop] = result;
        });
        return this;
    }

    protected setPropsByIds<K extends keyof T>(
        //service: ServiceBase<any>,
        findByIds: (ids: number[]) => Promise<T[K]>,
        prop: K,
        ids: number[],
    ): this {
        this.taskQueue.push(async () => {
            const results = await findByIds(ids);
            if(!results){ 
                throw new Error(`Entity not found within IDs: ${ids}`); 
            }
            this.entity[prop] = results;
        });
        return this;
    }

    protected setPropByName<K extends keyof T>(
        //service: ServiceBase<any>,
        findByName: (name: string) => Promise<any>,
        prop: K,
        name: string,
    ): this {
        this.taskQueue.push(async () => {
            const result = await findByName(name);
            if(!result){ 
                throw new Error(`Entity not found for name: ${name}`)
            };
            /*this.entity*/(this.entity as any)[prop] = result; 
        });
        return this;
    }

    protected setProp<K extends keyof T>(prop: K, value: T[K]): this {
        this.entity[prop] = value;
        return this;
    }

    public async build(): Promise<T> {
        for(const task of this.taskQueue){
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
}