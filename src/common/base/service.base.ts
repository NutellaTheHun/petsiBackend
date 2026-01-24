import { NotFoundException } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  QueryBuilder,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { AppLogger } from '../../modules/app-logging/app-logger';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { PaginatedResult } from '../dto/paginated-result';
import { DataBaseExceptionHandler } from '../exceptions/database-exception.handler';
import { ValidationException } from '../validation/validation-exception';
import { EntityBase } from './entity.base';
import { ValidatorBase } from './validator.base';

export abstract class ServiceBase<
  TEntity extends EntityBase<any, any, any, any, any>,
> {
  private databaseExceptionHandler: DataBaseExceptionHandler;
  private readonly dataSource: DataSource;
  constructor(
    private readonly entityRepo: Repository<TEntity['__Entity']>,
    //private readonly builder: BuilderBase<TEntity['__Entity']>,
    public readonly servicePrefix: string,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,

    private readonly validator?: ValidatorBase<TEntity>,
  ) {
    this.databaseExceptionHandler = new DataBaseExceptionHandler(logger);
  }

  /**
   * @returns The created entity or throws AppHttpException from validation errors.
   */
  public async create(createDto: any): Promise<TEntity['__Entity']> {
    const requestId = this.requestContextService.getRequestId();

    if (this.validator) {
      const validationErrors =
        await this.validator.validateCreateNode(createDto);
      if (validationErrors) {
        throw new ValidationException(validationErrors); // logging?
      }
    }

    // create entity
    //const entity = await this.builder.buildCreateDto(createDto);
    //let newEntityId;
    await this.dataSource.transaction(async (manager) => {
      //const entity = await this.createEntity(createDto, manager);
      try {
        return await this.createEntity(createDto, manager);
        // save in DB
        //const saved = await manager.save(entity);
        //newEntityId = entity.id;
      } catch (err) {
        throw this.databaseExceptionHandler.handle(
          err,
          this.servicePrefix,
          requestId,
          'CREATE',
        );
      }
    });
    throw new Error('entity creation failed');

    /*const resultEntity = await this.entityRepo.findOne({
      where: { id: newEntityId },
    });

    if (resultEntity && 'password' in resultEntity) {
      resultEntity.password = undefined;
    }

    return resultEntity;*/
  }

  /**
   * @returns Updated entity or throws AppHttpException if validation fails, or NotFoundException if the supplied ID doesn't aquire an entity.
   */
  async update(id: number, updateDto: any): Promise<TEntity['__Entity']> {
    const requestId = this.requestContextService.getRequestId();

    if (this.validator) {
      const validationErrors = await this.validator.validateUpdateNode(
        updateDto,
        id,
      );
      if (validationErrors) {
        throw new ValidationException(validationErrors); // logging?
      }
    }

    // retrieve entity from DB
    let toUpdate: TEntity['__Entity'];
    try {
      toUpdate = await this.findOne(id);
    } catch (err) {
      throw this.databaseExceptionHandler.handle(
        err,
        this.servicePrefix,
        requestId,
        'UPDATE',
      );
    }

    //update DTO
    //await this.builder.buildUpdateDto(toUpdate, updateDto);
    /**
     * Currently mutates toUpdate, and returns the updated entity (the same entity), i dont like this
     * Change updateEntity to return void to be more clear?
     * Must think through how the result object is returned
     *          - always requery the entity from the DB,
     *          - or within the method rebuild the object throughout the process.
     *                      - returned objects from updates would be piecemeal or have to always be fully constructed (all relations)? doesnt sound great
     *                                  - also goes against having any query params on what to send back, which would be an ideal control of what to return
     *
     * CHOICE: always requery db for final result seems cleanest, as its easily uniform and would work well with relation request params
     *          - if always requery DB, where should it be called?
     *                  - if inside updateEntity
     */
    await this.dataSource.transaction(async (manager) => {
      await this.updateEntity(toUpdate, updateDto, manager);
      try {
        //Save in DB
        await manager.save(toUpdate);
      } catch (err) {
        throw this.databaseExceptionHandler.handle(
          err,
          this.servicePrefix,
          requestId,
          'UPDATE',
        );
      }
    });
    //return await this.entityRepo.findOne({ where: { id: toUpdate.id } });
    const resultEntity = await this.entityRepo.findOne({
      where: { id: toUpdate.id },
    });

    if (resultEntity && 'password' in resultEntity) {
      resultEntity.password = undefined;
    }

    return resultEntity;
  }

  async findAll(options?: {
    relations?: string[];
    limit?: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
    filters?: string[];
    dateBy?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResult<TEntity['__Entity']>> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // Set options with default settings
    options = {
      limit: 10,
      sortOrder: 'ASC',
      ...options,
    };

    // Start query with query builder
    const query = this.entityRepo.createQueryBuilder('entity');

    if (options.relations) {
      for (const relation of options.relations) {
        query.leftJoinAndSelect(`entity.${relation}`, relation as string);
      }
    }

    /*if (options.sortBy) {
            query.orderBy(`entity.${options.sortBy}`, options.sortOrder);
        } else {
            query.orderBy('entity.id', 'ASC');
        }*/

    if (options.limit) {
      query.limit(options.limit + 1);
    }

    if (options.cursor) {
      const operator = options?.sortOrder === 'DESC' ? '<' : '>';
      query.andWhere(`entity.${options.sortBy ?? 'id'} ${operator} :cursor`, {
        cursor: options.cursor,
      });
    }

    if (options.sortBy && options.sortOrder) {
      this.applySortBy(query, options.sortBy, options.sortOrder);
    }

    if (options.search?.trim()) {
      this.applySearch(query, options.search.trim().toLowerCase());
    }

    if (options.filters) {
      // options.filters is always an array of strings here
      // e.g. ['inventoryArea,1', 'inventoryArea,2']
      const filterMap: Record<string, string[]> = {};
      for (const filter of options.filters) {
        const [key, value] = filter.split('=');
        if (!key || value === undefined) continue;
        if (!filterMap[key]) filterMap[key] = [];
        filterMap[key].push(value);
      }
      this.applyFilters(query, filterMap);
    }

    if (options.startDate) {
      this.applyDate(query, options.startDate, options.endDate, options.dateBy);
    }

    // run query
    let results: TEntity['__Entity'][] = [];
    try {
      results = await query.getMany();
    } catch (err) {
      throw this.databaseExceptionHandler.handle(
        err,
        this.servicePrefix,
        requestId,
        'FIND_ALL',
      );
    }

    // handle cursor
    let nextCursor: string | undefined;
    if (options.limit) {
      if (results.length > options.limit) {
        const nextEntity = results.pop();
        if (!nextEntity) {
          nextCursor = (nextEntity as any)[options.sortBy ?? 'id'].toString();
        }
      }
    }

    // log result
    this.logger.logAction(
      this.servicePrefix,
      requestId,
      'FIND_ALL',
      'REQUEST',
      { requestId, message: `${results.length} entities queried` },
    );

    // return result and cursor
    return {
      items: results,
      nextCursor,
    } as PaginatedResult<TEntity['__Entity']>;
  }

  /**
   * @returns Entity or throws NotFoundException
   */
  async findOne(
    id: number,
    relations?: Array<keyof TEntity['__Entity']>,
    childRelations?: string[],
  ): Promise<TEntity['__Entity']> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    const combinedRelations = [
      ...(relations?.map((r) => r.toString()) ?? []),
      ...(childRelations ?? []),
    ];

    // run query and return
    let result;
    try {
      result = await this.entityRepo.findOne({
        where: { id } as unknown as FindOptionsWhere<TEntity>,
        relations: combinedRelations,
      });
    } catch (err) {
      throw this.databaseExceptionHandler.handle(
        err,
        this.servicePrefix,
        requestId,
        'FIND_ONE',
      );
    }

    if (!result) {
      this.logger.logAction(
        this.servicePrefix,
        requestId,
        'FIND_ONE',
        'REQUEST',
        { requestId, id, message: `no entity found with id: ${id}` },
      );
      throw new NotFoundException();
    }

    return result;
  }

  async findEntitiesById(
    ids: number[],
    relations?: Array<keyof TEntity['__Entity']>,
  ): Promise<TEntity['__Entity'][]> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    // run query and return
    const result = await this.entityRepo.find({
      where: { id: In(ids) } as unknown as FindOptionsWhere<TEntity>,
      relations: relations as string[],
    });

    this.logger.logAction(
      this.servicePrefix,
      requestId,
      'FIND_ENTITIES_BY_ID',
      'REQUEST',
      { requestId, message: `${result.length} entities queried` },
    );

    return result;
  }

  async remove(id: number): Promise<Boolean> {
    const requestId = this.requestContextService.getRequestId();
    try {
      return (await this.entityRepo.delete(id)).affected !== 0;
    } catch (err) {
      throw this.databaseExceptionHandler.handle(
        err,
        this.servicePrefix,
        requestId,
        'REMOVE',
      );
    }
  }

  async insertEntity(
    entity: TEntity['__Entity'],
  ): Promise<TEntity['__Entity'] | null> {
    return await this.entityRepo.save(entity);
  }

  async insertEntities(
    entities: TEntity['__Entity'][],
  ): Promise<TEntity['__Entity'][] | null> {
    const results: TEntity['__Entity'][] = [];
    for (const entity of entities) {
      results.push(await this.entityRepo.save(entity));
    }
    return results;
  }

  getQueryBuilder(): QueryBuilder<TEntity['__Entity']> {
    const requestId = this.requestContextService.getRequestId();
    try {
      return this.entityRepo.createQueryBuilder();
    } catch (err) {
      throw this.databaseExceptionHandler.handle(
        err,
        this.servicePrefix,
        requestId,
        'GET_BUILDER',
      );
    }
  }

  protected applySearch(
    _query: SelectQueryBuilder<TEntity['__Entity']>,
    _search: string,
  ): void {
    // Default: do nothing. To be overridden by subclass if needed.
  }

  protected applyFilters(
    _query: SelectQueryBuilder<TEntity['__Entity']>,
    filters: Record<string, string[]>,
  ): void {
    // Default: do nothing. To be overridden by subclass if needed.
  }

  protected applyDate(
    _query: SelectQueryBuilder<TEntity['__Entity']>,
    startDate: string,
    endDate?: string,
    dateBy?: string,
  ) {
    // Default: do nothing. To be overridden by subclass if needed.
  }

  protected applySortBy(
    _query: SelectQueryBuilder<TEntity['__Entity']>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    // To be overridden by subclass if needed.

    // Default:
    _query.orderBy('entity.id', 'ASC');
  }

  protected abstract createEntity(
    dto: TEntity['__CDto'],
    manager: EntityManager,
  ): Promise<TEntity['__Entity']>;

  protected abstract updateEntity(
    dto: TEntity['__UDto'],
    manager: EntityManager,
    entity: TEntity['__Entity'],
  ): Promise<void>;
}
