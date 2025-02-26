import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";

export class ServiceBase<T extends ObjectLiteral> {
  
  constructor(
    private readonly entityRepo: Repository<T>,
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

  /*
  async findOneByName(name: string, relations?: string[]): Promise<T | null> {
    return await this.entityRepo.findOne({ 
        where: { name: name } as unknown as FindOptionsWhere<T>, 
        relations: relations  });
  }*/

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

  getQueryBuilder(): QueryBuilder<T> {
    return this.entityRepo.createQueryBuilder();
  }
}