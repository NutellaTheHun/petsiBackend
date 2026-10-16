import { NotFoundException } from '@nestjs/common';
import {
    EntityManager,
    FindOptionsWhere,
    In,
    QueryBuilder,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { PaginatedResult } from '../dto/paginated-result';
import { DatabaseError } from '../exceptions/database-error';
import { ValidationException } from '../validation/validation-exception';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
} from './change-detector.base';
import { EntityBase } from './entity.base';
import { ValidatorIdentityBaseInterface } from './validator-identity.base.interface';
import { ValidatorBase } from './validator.base';

export abstract class ServiceBase<TEntity extends EntityBase<any, any, any>> {
    constructor(
        protected readonly entityRepo: Repository<TEntity['__Entity']>,
        public readonly servicePrefix: string,
        protected readonly requestContextService: RequestContextService,
        private readonly validator?: ValidatorBase<
            TEntity,
            ValidatorIdentityBaseInterface
        >,
    ) {}

    /**
     * @returns The created entity or throws AppHttpException from validation errors.
     */
    public async create(createDto: any): Promise<TEntity['__Entity']> {
        if (this.validator) {
            const validationErrors = await this.validator.validate(
                createDto,
                'root',
            );
            if (validationErrors) {
                throw new ValidationException(validationErrors);
            }
        }

        const created = await this.entityRepo.manager.transaction(
            async (manager) => {
                try {
                    const entity = await this.createEntity(createDto, manager);
                    await this.afterCreateInTransaction(manager, entity);
                    return entity;
                } catch (err) {
                    throw DatabaseError.fromTypeOrmError(err);
                }
            },
        );

        if (created && 'password' in created) {
            (created as { password?: unknown }).password = undefined;
        }

        return created;
    }

    /**
     * @returns Updated entity or throws AppHttpException if validation fails, or NotFoundException if the supplied ID doesn't aquire an entity.
     */
    async update(id: number, updateDto: any): Promise<TEntity['__Entity']> {
        if (this.validator) {
            const validationErrors = await this.validator.validate(
                updateDto,
                id,
            );
            if (validationErrors) {
                throw new ValidationException(validationErrors);
            }
        }

        // retrieve entity from DB. Not wrapped: findOne already converts DB errors,
        // and its NotFoundException must surface as a 404, not a DatabaseException.
        const toUpdate: TEntity['__Entity'] = await this.findOne(
            id,
            this.getUpdateDiffRelations(),
        );

        let effectiveUpdateDto = updateDto as TEntity['__UDto'];
        let detectionResult:
            | ChangeDetectionResult<TEntity['__UDto']>
            | undefined;
        const changeDetector = this.getChangeDetector();
        if (changeDetector) {
            detectionResult = changeDetector.detect(
                toUpdate,
                updateDto as TEntity['__UDto'],
            );

            if (!detectionResult.hasChanges) {
                if (toUpdate && 'password' in toUpdate) {
                    (toUpdate as { password?: unknown }).password = undefined;
                }
                return toUpdate;
            }

            effectiveUpdateDto = detectionResult.patch;
        }

        await this.entityRepo.manager.transaction(async (manager) => {
            await this.updateEntity(effectiveUpdateDto, manager, toUpdate);
            try {
                //Save in DB
                await manager.save(toUpdate);
                await this.afterUpdateInTransaction(manager, toUpdate, {
                    detectionResult,
                });
            } catch (err) {
                throw DatabaseError.fromTypeOrmError(err);
            }
        });
        const resultEntity = await this.entityRepo.findOne({
            where: { id: toUpdate.id as number } as unknown as FindOptionsWhere<
                TEntity['__Entity']
            >,
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
        locationId?: number;
    }): Promise<PaginatedResult<TEntity['__Entity']>> {
        // Set options with default settings
        options = {
            limit: 10,
            sortOrder: 'ASC',
            ...options,
        };

        // Start query with query builder
        const query = this.entityRepo.createQueryBuilder('entity');

        // Unconditional (unlike applyFilters/applySearch/applyDate below, which only
        // run when the caller supplied the relevant option): tenant/location scoping
        // must never depend on the caller passing anything. See
        // TenantScopedServiceBase/LocationScopedServiceBase.
        this.applyScope(query, options);

        if (options.relations && options.relations.length > 0) {
            const relations = this.buildRelationStatements(options.relations);
            for (const relation of relations) {
                query.leftJoinAndSelect(relation.property, relation.alias);
            }
        }

        if (options.limit) {
            query.limit(options.limit + 1);
        }

        if (options.cursor) {
            const operator = options?.sortOrder === 'DESC' ? '<' : '>';
            query.andWhere(
                `entity.${options.sortBy ?? 'id'} ${operator} :cursor`,
                {
                    cursor: options.cursor,
                },
            );
        }

        if (options.sortBy && options.sortOrder) {
            this.applySortBy(query, options.sortBy, options.sortOrder);
        }

        if (options.search?.trim()) {
            this.applySearch(query, options.search.trim().toLowerCase());
        }

        if (options.filters) {
            // options.filters is always an array of strings here
            // e.g. ['inventoryArea=1', 'inventoryArea=2']
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
            this.applyDate(
                query,
                options.startDate,
                options.endDate,
                options.dateBy,
            );
        }

        // run query
        let results: TEntity['__Entity'][] = [];
        try {
            results = await query.getMany();
        } catch (err) {
            throw DatabaseError.fromTypeOrmError(err);
        }

        // handle cursor
        let nextCursor: string | undefined;
        if (options.limit) {
            // doesnt handle if sortByValue has duplicates
            if (results.length > options.limit) {
                const nextEntity = results.pop()!;
                const cursorCol = options.sortBy ?? 'id';
                nextCursor = String(
                    (nextEntity as Record<string, unknown>)[cursorCol],
                );
            }
        }

        // return result and cursor
        return {
            items: results,
            nextCursor,
        };
    }

    /**
     * @returns Entity or throws NotFoundException
     */
    async findOne(
        id: number,
        relations?: string[],
    ): Promise<TEntity['__Entity']> {
        // run query and return
        let result: TEntity['__Entity'] | null;
        try {
            result = await this.entityRepo.findOne({
                where: { id } as unknown as FindOptionsWhere<TEntity>,
                relations: relations,
            });
        } catch (err) {
            throw DatabaseError.fromTypeOrmError(err);
        }

        if (!result) {
            throw new NotFoundException();
        }

        return result;
    }

    async findEntitiesById(
        ids: number[],
        relations?: Array<keyof TEntity['__Entity']>,
    ): Promise<TEntity['__Entity'][]> {
        // run query and return
        const result = await this.entityRepo.find({
            where: { id: In(ids) } as unknown as FindOptionsWhere<TEntity>,
            relations: relations as string[],
        });

        return result;
    }

    async remove(id: number): Promise<boolean> {
        /* const requestId = this.requestContextService.getRequestId();
         try {
             //return (await this.entityRepo.remove( }))).affected !== 0;
             await this.dataSource.transaction(async (manager) => {
                 await manager.remove(await this.entityRepo.findOne({ where: { id } as unknown as FindOptionsWhere<TEntity> }));
             });
             return true;
         } catch (err) {
             throw DatabaseError.fromTypeOrmError(err);
         }*/

        try {
            return await this.entityRepo.manager.transaction(
                async (manager) => {
                    const entity = await manager.findOne(
                        this.entityRepo.target,
                        {
                            where: { id } as unknown as FindOptionsWhere<
                                TEntity['__Entity']
                            >,
                        },
                    );

                    if (!entity) return false;

                    await this.beforeRemove(entity, manager);

                    await manager.remove(entity);

                    await this.afterRemove(entity, manager);

                    return true;
                },
            );
        } catch (err) {
            throw DatabaseError.fromTypeOrmError(err);
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
        try {
            return this.entityRepo.createQueryBuilder();
        } catch (err) {
            throw DatabaseError.fromTypeOrmError(err);
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
        _filters: Record<string, string[]>,
    ): void {
        // Default: do nothing. To be overridden by subclass if needed.
    }

    protected applyDate(
        _query: SelectQueryBuilder<TEntity['__Entity']>,
        _startDate: string,
        _endDate?: string,
        _dateBy?: string,
    ) {
        // Default: do nothing. To be overridden by subclass if needed.
    }

    protected applySortBy(
        _query: SelectQueryBuilder<TEntity['__Entity']>,
        _sortBy: string,
        _sortOrder: 'ASC' | 'DESC',
    ): void {
        // To be overridden by subclass if needed.

        // Default:
        _query.orderBy('entity.id', 'ASC');
    }

    /**
     * Default: no scoping. Overridden by `TenantScopedServiceBase`/
     * `LocationScopedServiceBase` to filter every `findAll` query by the
     * caller's tenant (and location). Unlike `applyFilters`/`applySearch`/
     * `applyDate`, this always runs, regardless of what the caller passed in
     * `options` — a domain subclass overriding `applyFilters` for its own
     * filters never affects this, since it's a distinct hook.
     */
    protected applyScope(
        _query: SelectQueryBuilder<TEntity['__Entity']>,
        _options?: { locationId?: number },
    ): void {
        // Default: do nothing.
    }

    /**
     * Default: no scoping. Overridden by `TenantScopedServiceBase`/
     * `LocationScopedServiceBase` so that `ControllerBase`'s cache keys fold in
     * whatever part of the caller's identity affects query results (tenant,
     * and for location-scoped entities, the caller's authorized locations) —
     * otherwise a cached response for one tenant/location could be served to a
     * different tenant/location within the cache TTL. Public (unlike
     * `applyScope`) because `ControllerBase` — a sibling class, not a
     * subclass — needs to call it when building cache keys.
     */
    public getCacheScope(): string {
        return '';
    }

    /**
     * The scope `ControllerBase` uses when tracking/invalidating `findAll`
     * cache entries on create/update/remove. Defaults to `getCacheScope()`.
     * `LocationScopedServiceBase` overrides this to drop the location
     * component so a single write invalidates every location-view variant of
     * the `findAll` cache within the affected tenant, not just the writer's
     * own location scope.
     */
    public getCacheInvalidationScope(): string {
        return this.getCacheScope();
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

    protected getChangeDetector():
        | ChangeDetectorBase<TEntity['__Entity'], TEntity['__UDto']>
        | undefined {
        return undefined;
    }

    /**
     * Optional hook after create entity persisted inside the same transaction.
     */
    protected async afterCreateInTransaction(
        _manager: EntityManager,
        _entity: TEntity['__Entity'],
    ): Promise<void> {
        return;
    }

    /**
     * Optional hook after update entity saved inside the same transaction.
     */
    protected async afterUpdateInTransaction(
        _manager: EntityManager,
        _entity: TEntity['__Entity'],
        _ctx: {
            detectionResult?: ChangeDetectionResult<TEntity['__UDto']>;
        },
    ): Promise<void> {
        return;
    }

    protected getUpdateDiffRelations(): string[] {
        return [];
    }

    protected async beforeRemove(
        _entity: TEntity['__Entity'],
        _manager: EntityManager,
    ): Promise<void> {}

    protected async afterRemove(
        _entity: TEntity['__Entity'],
        _manager: EntityManager,
    ): Promise<void> {}

    buildRelationStatements(
        relations: string[],
    ): { property: string; alias: string }[] {
        const result: { property: string; alias: string }[] = [];
        for (const relation of relations) {
            //query.leftJoinAndSelect(`entity.${relation}`, relation as string);
            const string = relation.split('.');
            if (string.length === 1) {
                result.push({
                    property: `entity.${string[0]}`,
                    alias: string[0],
                });
            } else {
                const rel = string.at(-1)!;
                const alias = string.at(-2)!;
                result.push({ property: `${alias}.${rel}`, alias: rel });
            }
        }
        return result;
    }
}
