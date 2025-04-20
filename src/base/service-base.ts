import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";

export class ServiceBase<T extends ObjectLiteral> {
  
  constructor(
    private readonly entityRepo: Repository<T>,
  ){}

  
  async create(createDto: any): Promise<any | null>{
    // gets overridden by concrete implementations
  }

  async insertEntity(entity: T): Promise<T | null> {
    return await this.entityRepo.save(entity);
  }
  
  async insertEntities(entities: T[]): Promise<T[] | null> {
      const results: T[]  = [];
      for(const entity of entities){
          results.push(
            await this.entityRepo.save(entity)
          );
      }
      return results;
  }

  async findAll(relations?: Array<keyof T>): Promise<T[]> {
    return await this.entityRepo.find({relations: relations as string[]});
  }

  async findOne(id: number, relations?: Array<keyof T>, childRelations? : string[]): Promise<T | null> {
    const combinedRelations = [
      ...(relations?.map(r => r.toString()) ?? []),
      ...(childRelations ?? []),
    ];

    return await this.entityRepo.findOne({ 
        where: { id } as unknown as FindOptionsWhere<T>, 
        /*relations: relations as string[]*/
        relations: combinedRelations,
    });
  }

  async findEntitiesById( ids: number[], relations?: Array<keyof T>): Promise<T[]> {
    return await this.entityRepo.find({ 
        where: { id: In(ids) } as unknown as FindOptionsWhere<T>, 
        relations: relations as string[] });
  }

  async update(id: number, updateTDto: any): Promise<any | null> {
    // gets overridden by concrete implementations
  }

  async remove(id: number): Promise<Boolean> {
    return (await this.entityRepo.delete(id)).affected !== 0;
  }

  getQueryBuilder(): QueryBuilder<T> {
    return this.entityRepo.createQueryBuilder();
  }
}