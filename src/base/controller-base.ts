import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Cache } from "cache-manager";
import { parse, stringify } from 'flatted';
import { ObjectLiteral } from "typeorm";
import { AppLogger } from "../modules/app-logging/app-logger";
import { invalidateFindAllCache, trackFindAllKey } from "../util/cache.util";
import { AppHttpException } from "../util/exceptions/AppHttpException";
import { SOMETHING_WENT_WRONG } from "../util/exceptions/error_constants";
import { RequestContextService } from "../modules/request-context/RequestContextService";
import { ServiceBase } from "./service-base";

export class ControllerBase<T extends ObjectLiteral> {

  constructor(
    protected readonly entityService: ServiceBase<T>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    public controllerPrefix: string,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  @Post()
  async create(@Body() createDto: any): Promise<T> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    this.logger.logAction(
      this.controllerPrefix,
      requestId,
      'CREATE',
      'REQUEST',
      { requestId }
    );

    // run service, log/throw errors
    const result = await this.entityService.create(createDto);
    if(!result){
      const err = new AppHttpException(
        `${this.controllerPrefix}-create: request failed, create result is null`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        SOMETHING_WENT_WRONG,
        { requestId }
      );

      this.logger.logError(
        this.controllerPrefix,
        requestId,
        'CREATE',
        err,
        { requestId }
      );

      throw err;
    }

    // return result
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
  ): Promise<{items: T[], nextCursor?: string }> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    this.logger.logAction(
      this.controllerPrefix,
      requestId,
      'FIND_ALL',
      'REQUEST',
      { requestId, options: { relations, limit, cursor, sortBy, sortOrder } }
    );

    // Build cache key
    const cacheKey = `${this.entityService.cacheKeyPrefix}-findAll-${JSON.stringify({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder
    })}`;

    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if(cached){ 
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
    await trackFindAllKey(this.entityService.cacheKeyPrefix, cacheKey, this.cacheManager, 60_000);

    // Cache Result
    if(result){
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
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T | null> {
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    this.logger.logAction(
      this.controllerPrefix,
      requestId,
      'FIND_ONE',
      'REQUEST',
      { requestId, id }
    );

    // Build cache key
    const cacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;

    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if(cached){
      this.logger.logAction(
        this.controllerPrefix,
        requestId,
        'FIND_ONE',
        'CACHE HIT',
        { requestId }
      );

      return parse(cached);
    } 

    // Query DB
    const result =  await this.entityService.findOne(id);

    // Cache Result
    if(result){ 
      this.logger.logAction(
        this.controllerPrefix,
        requestId,
        'FIND_ONE',
        'RESULT CACHED',
        { requestId }
      );
      await this.cacheManager.set(cacheKey, stringify(result), 60_000);
    }
    
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
    // Get requestId
    const requestId = this.requestContextService.getRequestId();

    this.logger.logAction(
      this.controllerPrefix,
      requestId,
      'UPDATE',
      'REQUEST',
      { requestId, id }
    );

    // Run service, log/throw errors
    const updated = await this.entityService.update(id, updateDto);
    if(!updated){ 
      const err = new AppHttpException(
        `${this.controllerPrefix}-update: request failed, update result is null`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        SOMETHING_WENT_WRONG,
        { requestId }
      );

      this.logger.logError(
        this.controllerPrefix,
        requestId,
        'UPDATE',
        err,
        { requestId }
      );

      throw err;
    }

  // Cache findOne Result, invalidate findAll cache
    if(updated){
      this.logger.logAction(
        this.controllerPrefix,
        requestId,
        'UPDATE',
        'RESULT CACHED',
        { requestId }
      );
      const cacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;
      await this.cacheManager.set(cacheKey, stringify(updated), 60_000);

      await invalidateFindAllCache(this.entityService.cacheKeyPrefix, this.cacheManager);
    }

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
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    // Get requestId
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
    
    // invalidate findOne and findAll cache
    if(removal) {
      this.logger.logAction(
        this.controllerPrefix,
        requestId,
        'REMOVE',
        'CACHE INVALIDATED',
      )
      const singleCacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;
      await this.cacheManager.del(singleCacheKey);
      await invalidateFindAllCache(this.entityService.cacheKeyPrefix, this.cacheManager);
    }

    // Return result
    this.logger.logAction(
        this.controllerPrefix,
        requestId,
        'REMOVE',
        'SUCCESS',
      )
    return removal;
  }
}