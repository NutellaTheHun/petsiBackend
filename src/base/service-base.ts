import { HttpStatus, NotFoundException } from "@nestjs/common";
import { FindOptionsWhere, In, ObjectLiteral, QueryBuilder, Repository } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { AppHttpException } from "../util/exceptions/AppHttpException";
import { DTO_VALIDATION_FAIL } from "../util/exceptions/error_constants";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { BuilderBase } from "./builder-base";
import { ValidatorBase } from "./validator-base";
import { PaginatedResult } from "./paginated-result";

export abstract class ServiceBase<T extends ObjectLiteral> {
  
  constructor(
    private readonly entityRepo: Repository<T>,
    private readonly builder: BuilderBase<T>,
    protected readonly validator: ValidatorBase<T>,
    public cacheKeyPrefix: string,
    private readonly requestContextService: RequestContextService,
    private logger: AppLogger,
  ){}

  /**
   * @returns The created entity or throws AppHttpException from validation errors.
   */
  public async create(createDto: any): Promise<T>{
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // validate DTO
    const error = await this.validator.validateCreate(createDto);
    if(error){ 
      const err = new AppHttpException(
        `${this.cacheKeyPrefix}: create dto validation failed`,
        HttpStatus.BAD_REQUEST,
        DTO_VALIDATION_FAIL,
        { error }
      );

      this.logger.logError(
        this.cacheKeyPrefix,
        requestId,
        'CREATE',
        err,
        { requestId }
      );

      throw err;
    }

    // create entity
    const entity = await this.builder.buildCreateDto(createDto);

    // save in DB
    return await this.entityRepo.save(entity);
  }

  /**
   * @returns Updated entity or throws AppHttpException if validation fails, or NotFoundException if the supplied ID doesn't aquire an entity.
   */
  async update(id: number, updateDto: any): Promise<T> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // validate DTO
    const error = await this.validator.validateUpdate(updateDto);
    if(error){ 
      const err = new AppHttpException(
        `${this.cacheKeyPrefix}: update dto validation failed`,
        HttpStatus.BAD_REQUEST,
        DTO_VALIDATION_FAIL,
        { error }
      );

      this.logger.logError(
        this.cacheKeyPrefix,
        requestId,
        'UPDATE',
        err,
        { requestId, id }
      );

      throw err; 
    }

    // retrieve entity from DB
    const toUpdate = await this.findOne(id);
    if(!toUpdate){ 
      const err = new AppHttpException(
      `${this.cacheKeyPrefix}: entity to update not found id: ${id}`,
      HttpStatus.BAD_REQUEST,
      DTO_VALIDATION_FAIL,
      { requestId }
    );

    this.logger.logError(
      this.cacheKeyPrefix,
      requestId,
      'UPDATE',
      err,
      { requestId, id }
    );

      throw err;
    }

    //update DTO
    await this.builder.buildUpdateDto(toUpdate, updateDto);

    //Save in DB
    return await this.entityRepo.save(toUpdate);
  }

  async findAll( options?: {
    relations?: string[];
    limit?: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC'; 
  }): Promise</*{items: T[], nextCursor?: string}*/PaginatedResult<T>> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // Set options with default settings
    options = {
      limit: 10,
      sortOrder: 'ASC',
      ...options,
    }

    // Start query with query builder
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

    // run query
    const results = await query.getMany();

    // handle cursor
    let nextCursor: string | undefined;
    if(options.limit){
      if(results.length > options.limit){
        const nextEntity = results.pop();
        nextCursor = (nextEntity as any)[options.sortBy ?? 'id'].toString();
      }
    }

    this.logger.logAction(
      this.cacheKeyPrefix,
      requestId,
      'FIND_ALL',
      'REQUEST',
      { requestId, message: `${results.length} entities queried` }
    );
    
    // return result and cursor
    return {
      items: results,
      nextCursor,
    } as PaginatedResult<T>;
  }

  /**
   * @returns Entity or throws NotFoundException
   */
  async findOne(id: number, relations?: Array<keyof T>, childRelations? : string[]): Promise<T> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    const combinedRelations = [
      ...(relations?.map(r => r.toString()) ?? []),
      ...(childRelations ?? []),
    ];

    // run query and return
    const result = await this.entityRepo.findOne({ 
        where: { id } as unknown as FindOptionsWhere<T>, 
        relations: combinedRelations,
    });

    if(!result){
      this.logger.logAction(
        this.cacheKeyPrefix,
        requestId,
        'FIND_ONE',
        'REQUEST',
        { requestId, id, message: `no entity found with id: ${id}`}
      );
      throw new NotFoundException();
    }

    return result;
  }

  async findEntitiesById( ids: number[], relations?: Array<keyof T>): Promise<T[]> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // run query and return
    const result = await this.entityRepo.find({ 
        where: { id: In(ids) } as unknown as FindOptionsWhere<T>, 
        relations: relations as string[] 
    });

    this.logger.logAction(
      this.cacheKeyPrefix,
      requestId,
      'FIND_ENTITIES_BY_ID',
      'REQUEST',
      { requestId, message: `${result.length} entities queried` }
    );

    return result
  }

  async remove(id: number): Promise<Boolean> {
    return (await this.entityRepo.delete(id)).affected !== 0;
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

  getQueryBuilder(): QueryBuilder<T> {
    return this.entityRepo.createQueryBuilder();
  }
}