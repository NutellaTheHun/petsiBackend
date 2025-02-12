import { ObjectLiteral, Repository } from "typeorm";

export class CrudRepoService<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {

    constructor(
        private repo: Repository<T>,
        private createDto: new () => CDto,
        private updateDto: new () => UDto,
    ){}

    findAll(): Promise<T[]> {
        return this.repo.find();
    }

    findOne(id: number): Promise<T | null> {
        return this.repo.findOne({ id } as any);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    async create(createDto : CDto) : Promise<any> {
        await this.repo.save(this.mapToEntity(createDto));
    }

    async update(id: number, updateDto: UDto) : Promise<any> {
        await this.repo.save(this.mapToEntity(updateDto));
    }

    private mapToEntity(dto: CDto | UDto): T {
        const entity = new(this.repo.target as new () => T)();
        Object.assign(entity, dto);
        return entity;
    }
}