import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";
import { BuilderBase } from "./builder-base";

export abstract class ServiceBase<T extends ObjectLiteral> {
  
  constructor(
    private readonly entityRepo: Repository<T>,
    private readonly builder: BuilderBase<T>,
    public cacheKeyPrefix: string,
  ){}


  public async create(createDto: any): Promise<any | null>{
    if(!this.isValidToCreate(createDto)){ return null; }

    const entity = await this.builder.buildCreateDto(createDto); //handle parent
    return await this.entityRepo.save(entity);
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

  async findAll( options?: {
    relations?: string[];
    limit?: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC'; 
  }): Promise<{items: T[], nextCursor?: string}> {

    options = {
      limit: 10,
      sortOrder: 'ASC',
      ...options,
    }

    const query = this.entityRepo.createQueryBuilder('entity');

    if(options.relations){
      for(const relation of options.relations){
        query.leftJoinAndSelect(`entity.${relation}`, relation as string);
      }
    }

    if(options.sortBy){
      query.orderBy(`entity.${options.sortBy}`, options.sortOrder);
    } else {
      query.orderBy('entity.id', 'ASC');
    }

    if(options.limit){
      query.limit(options.limit+1);
    }
    
    if(options.cursor) {
      const operator = options?.sortOrder === 'DESC' ? '<' : '>';
      query.andWhere(`entity.${options.sortBy ?? 'id'} ${operator} :cursor`, { cursor: options.cursor });
    }

    const results = await query.getMany();

    let nextCursor: string | undefined;
    if(options.limit){
      if(results.length > options.limit){
        const nextEntity = results.pop();
        nextCursor = (nextEntity as any)[options.sortBy ?? 'id'].toString();
      }
    }
    
    return {
      items: results,
      nextCursor,
    };
  }

  async findOne(id: number, relations?: Array<keyof T>, childRelations? : string[]): Promise<T | null> {
    const combinedRelations = [
      ...(relations?.map(r => r.toString()) ?? []),
      ...(childRelations ?? []),
    ];

    return await this.entityRepo.findOne({ 
        where: { id } as unknown as FindOptionsWhere<T>, 
        relations: combinedRelations,
    });
  }

  async findEntitiesById( ids: number[], relations?: Array<keyof T>): Promise<T[]> {
    return await this.entityRepo.find({ 
        where: { id: In(ids) } as unknown as FindOptionsWhere<T>, 
        relations: relations as string[] });
  }

  async update(id: number, updateDto: any): Promise<any | null> {
    const toUpdate = await this.findOne(id) // handle relations
    if(!toUpdate){ return null; }

    await this.builder.buildUpdateDto(toUpdate, updateDto);
    return await this.entityRepo.save(toUpdate);
  }

  async remove(id: number): Promise<Boolean> {
    return (await this.entityRepo.delete(id)).affected !== 0;
  }

  getQueryBuilder(): QueryBuilder<T> {
    return this.entityRepo.createQueryBuilder();
  }

  protected async isValidToCreate(dto: any): Promise<boolean> {
    return true;
  }
}