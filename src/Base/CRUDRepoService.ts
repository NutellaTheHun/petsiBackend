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

    async removeById(id: number): Promise<void> {
        await this.repo.delete(id);
    }
    /*
    async create(createDto : CDto) : Promise<any> {
        await this.repo.save(this.mapToEntity(createDto));
    }
        */
    async create(entity : T) : Promise<any> {
        await this.repo.save(entity);
    }

    /**
     * 
     * @param id Currently not using ID, Repository.save is currently being used. Required if was using update()
     * @param updateDto 
     */
    /*
    async update(id: number, updateDto : UDto) : Promise<any> {
        await this.repo.save(this.mapToEntity(updateDto));
    }
    */
    async update(id: number, entity : T) : Promise<any> {
        await this.repo.save(entity);
    }

    private mapToEntity(dto: CDto | UDto): T {
        const entity = new(this.repo.target as new () => T)();
        Object.assign(entity, dto);
        return entity;
    }
}