import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";
import { EntityFactory } from "./entity-factory";

export class ServiceBase<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {
  
  constructor(
    private readonly entityRepo: Repository<T>,
    private readonly entityFactory: EntityFactory<T, CDto, UDto>,
    private createDto: new () => CDto,
    private updateDto: new () => UDto,
  ){}

  /*
  async create(createDto: CDto){
    // gets overridden by concrete implementations
  }*/

  async findAll(relations?: string[]): Promise<T[]> {
    return await this.entityRepo.find({relations: relations});
  }

  async findOne(id: number, relations?: string[]): Promise<T | null> {
    return await this.entityRepo.findOne({ 
        where: { id } as unknown as FindOptionsWhere<T>, 
        relations: relations }
    );
  }

  async findOneByName(name: string, relations?: string[]): Promise<T | null> {
    return await this.entityRepo.findOne({ 
        where: { name: name } as unknown as FindOptionsWhere<T>, 
        relations: relations  });
  }

  async findEntitiesById( ids: number[], relations?: string[]): Promise<T[]> {
    return await this.entityRepo.find({ 
        where: { id: In(ids) } as unknown as FindOptionsWhere<T>, 
        relations: relations });
  }

  /*
  async update(id: number, updateTDto: UDto) {
    // gets overridden by concrete implementations
  }*/

  async remove(id: number): Promise<Boolean> {
    return (await this.entityRepo.delete(id)).affected !== 0;
  }

  createTQueryBuilder(): QueryBuilder<T> {
    return this.entityRepo.createQueryBuilder();
  }
}