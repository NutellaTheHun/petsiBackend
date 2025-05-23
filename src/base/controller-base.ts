import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Cache } from "cache-manager";
import { parse, stringify } from 'flatted';
import { ObjectLiteral } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { invalidateFindAllCache, trackFindAllKey } from "../util/cache.util";
import { AppHttpException } from "../util/exceptions/app-http-exception";
import { DatabaseError } from "../util/exceptions/database-error";
import { ServiceBase } from "./service-base";
import { ENTITY_NOT_FOUND } from "../util/exceptions/error_constants";

export class ControllerBase<T extends ObjectLiteral> {
    constructor(
        protected readonly entityService: ServiceBase<T>,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        public controllerPrefix: string,
        private readonly requestContextService: RequestContextService,
        private readonly logger: AppLogger,
    ) { }

    @Post()
    async create(@Body() createDto: any): Promise<T> {

        const requestId = this.requestContextService.getRequestId();
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'CREATE',
            'REQUEST',
            { requestId }
        );

        const result = await this.entityService.create(createDto);

        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'CREATE',
            'SUCCESS',
            { requestId }
        );
        return result;
    }

    @Get()
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<{ items: T[], nextCursor?: string }> {
        const requestId = this.requestContextService.getRequestId();
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'FIND_ALL',
            'REQUEST',
            { requestId, options: { relations, limit, cursor, sortBy, sortOrder } }
        );

        // Build cache key
        const cacheKey = `${this.entityService.servicePrefix}-findAll-${JSON.stringify({
            relations,
            limit,
            cursor,
            sortBy,
            sortOrder
        })}`;

        // Check cache
        const cached = await this.cacheManager.get<string>(cacheKey);
        if (cached) {
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'FIND_ALL',
                'CACHE HIT',
                { requestId }
            );
            return parse(cached);
        }

        // Query DB
        const result = await this.entityService.findAll({
            relations,
            limit,
            cursor,
            sortBy,
            sortOrder,
        });

        // Add key for invalidation
        await trackFindAllKey(this.entityService.servicePrefix, cacheKey, this.cacheManager, 60_000);

        // Cache Result
        if (result) {
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'FIND_ALL',
                'RESULT CACHED',
                { requestId }
            );
            await this.cacheManager.set(cacheKey, stringify(result), 60_000);
        }

        // Return result
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'FIND_ALL',
            'SUCCESS',
            { requestId }
        );
        return result;
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<T> {
        const requestId = this.requestContextService.getRequestId();
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'FIND_ONE',
            'REQUEST',
            { requestId, id }
        );

        // Build cache key
        const cacheKey = `${this.entityService.servicePrefix}-findOne-${id}`;

        // Check cache
        const cached = await this.cacheManager.get<string>(cacheKey);
        if (cached) {
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'FIND_ONE',
                'CACHE HIT',
                { requestId }
            );

            // return if cache hit
            return parse(cached);
        }

        // Query DB
        const result = await this.entityService.findOne(id);

        // Cache result
        await this.cacheManager.set(cacheKey, stringify(result), 60_000);
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'FIND_ONE',
            'RESULT CACHED',
            { requestId }
        );

        // Return result
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'FIND_ONE',
            'SUCCESS',
            { requestId }
        );
        return result;
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any): Promise<T> {
        const requestId = this.requestContextService.getRequestId();
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'UPDATE',
            'REQUEST',
            { requestId, id }
        );

        // Update
        const updated = await this.entityService.update(id, updateDto);

        const cacheKey = `${this.entityService.servicePrefix}-findOne-${id}`;

        // Cache result
        await this.cacheManager.set(cacheKey, stringify(updated), 60_000);
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'UPDATE',
            'RESULT CACHED',
            { requestId }
        );

        // Invalidate findAll cache
        await invalidateFindAllCache(this.entityService.servicePrefix, this.cacheManager);

        // Return result
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'UPDATE',
            'SUCCESS',
            { requestId }
        );
        return updated;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        const requestId = this.requestContextService.getRequestId();
        this.logger.logAction(
            this.controllerPrefix,
            requestId,
            'REMOVE',
            'REQUEST',
            { requestId }
        );

        // Remove from db
        const removal = await this.entityService.remove(id);
        if (removal) {
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'REMOVE',
                'CACHE INVALIDATED',
            );

            // invalidate findOne and findAll cache
            const singleCacheKey = `${this.entityService.servicePrefix}-findOne-${id}`;
            await this.cacheManager.del(singleCacheKey);
            await invalidateFindAllCache(this.entityService.servicePrefix, this.cacheManager);

            // Log result
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'REMOVE',
                'SUCCESS',
            );
        } else {
            this.logger.logAction(
                this.controllerPrefix,
                requestId,
                'REMOVE',
                'FAIL',
            );
            throw new AppHttpException(
                `${this.controllerPrefix} removal failed`,
                HttpStatus.NOT_FOUND,
                ENTITY_NOT_FOUND,
                { contextId: requestId }
            )
        }
    }
}
