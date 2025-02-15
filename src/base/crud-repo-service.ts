import { FindOneOptions, ObjectLiteral, Repository } from "typeorm";

export class CrudRepoService<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {

    constructor(
        private repo: Repository<T>,
        private createDto: new () => CDto,
        private updateDto: new () => UDto,
    ){}

    findAll(): Promise<T[]> {
        return this.repo.find();
    }

    findOne(findOptions: FindOneOptions<T>): Promise<T | null> {
        return this.repo.findOne(findOptions);
    }

    find(findOptions: FindOneOptions<T>): Promise<T[] | null> {
        return this.repo.find(findOptions);
    }

    async removeById(id: number) {
        return await this.repo.delete(id);
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