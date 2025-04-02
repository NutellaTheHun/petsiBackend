import { ObjectLiteral } from "typeorm";
import { ServiceBase } from "./service-base";

export class BuilderMethodBase<T extends ObjectLiteral> {
    constructor(
        private readonly entityService: ServiceBase<T>,
        private byNameFunc?: (name: string) => Promise<T | null>,
    ){ }

    public async entityById(propertySetter: (entity: T) => void, id: number): Promise<void> {
        const entity = await this.entityService.findOne(id);
        if(!entity){ 
            throw new Error(`Entity not found in service: ${this.entityService.constructor.name}`); 
        }
        propertySetter(entity);
    }

    public async entityByName(propertySetter: (entity: T) => void, name: string): Promise<void>{
        if(!this.byNameFunc){ 
            throw new Error(`byName function is not set for service but is being called: ${this.entityService.constructor.name}`); 
        }

        const entity = await this.byNameFunc(name);
        if(!entity){ 
            throw new Error(`Entity by name not found in service: ${this.entityService.constructor.name}`); 
        }
        propertySetter(entity);
    }

    public async entityByIds(propertySetter: (entities: T[]) => void, ids: number[]): Promise<void> {
        const entities = await this.entityService.findEntitiesById(ids);
        propertySetter(entities);
    }
}