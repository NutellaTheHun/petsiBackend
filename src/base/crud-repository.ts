import { FindManyOptions, FindOneOptions, FindOptionsWhere, In, ObjectLiteral, QueryBuilder, QueryFailedError, Repository } from "typeorm";

export class CrudRepository<T extends ObjectLiteral> extends Repository<T>{

    async insertEntity(entities: T[] | T): Promise<T | T[] | QueryFailedError> {
        if(Array.isArray(entities)){
            return await this.save(entities);
        }
        return await this.save(entities);
    }

    async getOne(findOptions: FindOneOptions<T>): Promise<T | null> {
        return await this.findOne(findOptions);
    }

    async getMany(findManyOptions?: FindManyOptions<T>): Promise<T[]> {
        return await this.find(findManyOptions || {});
    }

    /**
     * Id is currently not used, using Repository.save to ensure lifecycle hooks
     * @param id Currently not used, using Repository.save to ensure lifecycle hooks
     * @param entity 
     * @returns 
     */
    async updateEntity(id: number, entity: T): Promise<T> {
        return await this.save(entity);
    }

    async removeEntity(options: FindOptionsWhere<T> | T | number): Promise<Boolean> {
        return (await this.delete(options)).affected !== 0;
    }
    
    getQueryBuilder(): QueryBuilder<T> {
        return this.createQueryBuilder();
    }
}