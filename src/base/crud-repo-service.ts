import { triggerAsyncId } from "async_hooks";
import { Result } from "postcss";
import { DeleteResult, FindOneOptions, FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";

/**
 * A generic Repository service that essentially wraps around typeORM Repositories to provide basic database access methods.
 */
export class CrudRepoService<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {

    constructor(
        private repo: Repository<T>,
        private createDto: new () => CDto,
        private updateDto: new () => UDto,
    ){}

    async findAll(): Promise<T[]> {
        return await this.repo.find();
    }

    async findOne(findOptions: FindOneOptions<T>): Promise<T | null> {
        return await this.repo.findOne(findOptions);
    }

    async find(findOptions: FindOneOptions<T>): Promise<T[] | null> {
        return await this.repo.find(findOptions);
    }
    
    async remove(entity: T): Promise<T> {
        const result = await this.repo.remove(entity);
        return result;
    }
    /*
    async remove(entity : T): Promise<DeleteResult> {
        return await this.repo.delete(entity);
    }*/
    
    //Cant access id within type T without id being type any, with idField: string = 'id'
    async removeById(id: any, idField: string = 'id'): Promise<DeleteResult> {
        const entity = await this.repo.findOne({ where: { id } });
        if(!entity){
            throw new Error('entity with id:${id} not found')
        }
        return await this.repo.delete(entity);
        //return await this.remove(entity);
    }
    

    async create(entity : T) : Promise<T> {
        return await this.repo.save(entity);
    }

    /**
     * 
     * @param id Currently not using ID, Repository.save is currently being used. Required if was using update()
     * @param updateDto 
     */
    async update(id: number, entity : T) : Promise<T> {
        return await this.repo.save(entity);
    }
}