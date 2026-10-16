import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Body,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { parse, stringify } from 'flatted';
import { PinoLogger } from 'nestjs-pino';
import {
    invalidateFindAllCache,
    trackFindAllKey,
} from '../../infrastructure/cache/cache.util';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { EntityBase } from './entity.base';
import { ServiceBase } from './service.base';

export class ControllerBase<
    TEntity extends EntityBase<any, any, any>,
> {
    constructor(
        protected readonly entityService: ServiceBase<TEntity>,
        @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
        public controllerPrefix: string,
        private readonly requestContextService: RequestContextService,
        private readonly logger: PinoLogger,
    ) { }

    private logCacheEvent(
        event: 'CACHE HIT' | 'RESULT CACHED' | 'CACHE INVALIDATED',
        action: string,
        cacheKey: string,
    ): void {
        this.logger.debug(
            {
                controllerPrefix: this.controllerPrefix,
                servicePrefix: this.entityService.servicePrefix,
                action,
                cacheKey,
            },
            event,
        );
    }

    @Post()
    async create(@Body() createDto: any): Promise<TEntity['__Entity']> {
        const result = await this.entityService.create(createDto);

        // Invalidate findAll cache
        await invalidateFindAllCache(
            this.entityService.servicePrefix,
            this.cacheManager,
            this.entityService.getCacheInvalidationScope(),
        );
        return result;
    }

    @Get()
    async findAll(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        @Query('dateBy') dateBy?: string,
        @Query('startDate') startDate?: string, // ISO format string
        @Query('endDate') endDate?: string, // ISO format string
    ): Promise<{ items: TEntity['__Entity'][]; nextCursor?: string }> {
        let relations: string[] = [];
        if (rawRelations) {
            relations = Array.isArray(rawRelations) ? rawRelations : [rawRelations];

            relations = relations.filter(
                (r) => r !== undefined && r !== 'undefined',
            ) as string[];
        }

        const filterArray = Array.isArray(filters)
            ? filters
            : filters
                ? [filters]
                : [];

        // Build cache key — scoped by the caller's tenant (and, for
        // location-scoped entities, authorized locations) so a cached
        // response for one tenant/location can never be served to another.
        const cacheScope = this.entityService.getCacheScope();
        const cacheKey = `${this.entityService.servicePrefix}-findAll-${cacheScope}-${JSON.stringify(
            {
                relations,
                limit,
                cursor,
                sortBy,
                sortOrder,
                search,
                filters: filterArray,
                dateBy,
                startDate,
                endDate,
            },
        )}`;

        // Check cache
        const cached = await this.cacheManager.get<string>(cacheKey);
        if (cached) {
            this.logCacheEvent('CACHE HIT', 'FIND_ALL', cacheKey);
            return parse(cached);
        }

        // Query DB
        const result = await this.entityService.findAll({
            relations,
            limit,
            cursor,
            sortBy,
            sortOrder,
            search,
            filters: filterArray,
            dateBy,
            startDate,
            endDate,
        });

        // Add key for invalidation
        await trackFindAllKey(
            this.entityService.servicePrefix,
            cacheKey,
            this.cacheManager,
            60_000,
            this.entityService.getCacheInvalidationScope(),
        );

        // Cache Result
        if (result) {
            this.logCacheEvent('RESULT CACHED', 'FIND_ALL', cacheKey);
            await this.cacheManager.set(cacheKey, stringify(result), 60_000);
        }
        return result;
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('relations') rawRelations?: string | string[],
    ): Promise<TEntity['__Entity']> {
        let relations: string[] = [];
        if (rawRelations) {
            relations = Array.isArray(rawRelations) ? rawRelations : [rawRelations];

            relations = relations.filter(
                (r) => r !== undefined && r !== 'undefined',
            ) as string[];
        }

        // Build cache key — scoped by the caller's tenant (and, for
        // location-scoped entities, authorized locations); see findAll above.
        const cacheKey = `${this.entityService.servicePrefix}-findOne-${this.entityService.getCacheScope()}-${id}`;

        // Check cache
        const cached = await this.cacheManager.get<string>(cacheKey);
        if (cached) {
            this.logCacheEvent('CACHE HIT', 'FIND_ONE', cacheKey);

            // return if cache hit
            return parse(cached);
        }

        // Query DB
        const result = await this.entityService.findOne(id, relations);

        // Cache result
        await this.cacheManager.set(cacheKey, stringify(result), 60_000);
        this.logCacheEvent('RESULT CACHED', 'FIND_ONE', cacheKey);
        return result;
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: any,
    ): Promise<TEntity['__Entity']> {
        // Update
        const updated = await this.entityService.update(id, updateDto);

        const cacheKey = `${this.entityService.servicePrefix}-findOne-${this.entityService.getCacheScope()}-${id}`;

        // Cache result
        await this.cacheManager.set(cacheKey, stringify(updated), 60_000);
        this.logCacheEvent('RESULT CACHED', 'UPDATE', cacheKey);

        // Invalidate findAll cache
        await invalidateFindAllCache(
            this.entityService.servicePrefix,
            this.cacheManager,
            this.entityService.getCacheInvalidationScope(),
        );
        return updated;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        // Remove from db
        const removal = await this.entityService.remove(id);
        if (removal) {
            // invalidate findOne and findAll cache
            const singleCacheKey = `${this.entityService.servicePrefix}-findOne-${this.entityService.getCacheScope()}-${id}`;
            await this.cacheManager.del(singleCacheKey);
            this.logCacheEvent('CACHE INVALIDATED', 'REMOVE', singleCacheKey);
            await invalidateFindAllCache(
                this.entityService.servicePrefix,
                this.cacheManager,
                this.entityService.getCacheInvalidationScope(),
            );
        } else {
            throw new NotFoundException();
        }
    }
}
