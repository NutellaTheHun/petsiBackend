import { FindManyOptions, FindOneOptions, ObjectLiteral, QueryBuilder, QueryFailedError, Repository } from "typeorm";

/**
 * A generic Repository service that essentially wraps around typeORM Repositories to provide basic database access methods.
 */
export class CrudRepoService<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {

    constructor(
        private repo: Repository<T>,
        private createDto: new () => CDto,
        private updateDto: new () => UDto,
    ){}

    async findAll(): Promise<T[] | []> {
        return await this.repo.find();
    }

    async findOne(findOptions: FindOneOptions<T>): Promise<T | null> {
        return await this.repo.findOne(findOptions);
    }

    async find(findOptions: FindManyOptions<T>): Promise<T[] | []> {
        return await this.repo.find(findOptions);
    }
    
    async remove(entity: T): Promise<boolean> {
        //const result = await this.repo.remove(entity);
        const result = await this.repo.delete(entity);
        return result.affected !== 0;
    }
    /*
    async remove(entity : T): Promise<DeleteResult> {
        return await this.repo.delete(entity);
    }*/
    
    //Cant access id within type T without id being type any, with idField: string = 'id'
    async removeById(id: any, idField: string = 'id'): Promise<Boolean> {
        const entity = await this.repo.findOne({ where: { id } });
        if(entity){
            return this.remove(entity);
        }
        return false;
    }
    

    async create(entity : T) : Promise<T | QueryFailedError> {
        return await this.repo.save(entity);
    }

    /**
     * 
     * @param id Currently not using ID, Repository.save is currently being used. Required if was using update()
     * @param updateDto 
     */
    async update(id: number, entity : T) : Promise<T> {
        //return await this.repo.save(entity);
        return await this.repo.save(entity);
    }

    createQueryBuilder(): QueryBuilder<T> {
        return this.repo.createQueryBuilder();
    }
}