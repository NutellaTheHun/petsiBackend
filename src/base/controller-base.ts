import { ObjectLiteral } from "typeorm";
import { ServiceBase } from "./service-base";
import { Body, Delete, Get, HttpCode, HttpStatus, Inject, OnModuleInit, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { stringify, parse } from 'flatted';
import { invalidateFindAllCache, trackFindAllKey } from "../util/cache.util";
import { Logger } from "nestjs-pino";
import { ModuleRef } from "@nestjs/core";

export class ControllerBase<T extends ObjectLiteral> {
  constructor(
    protected readonly entityService: ServiceBase<T>,
    @Inject(CACHE_MANAGER) 
    private readonly cacheManager: Cache,

    private readonly logger: Logger,
  ) {}

  @Post()
  async create(@Body() createDto: any): Promise<T | null> {
    this.logger.log('POST / called');
    return await this.entityService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<{items: T[], nextCursor?: string }> {
    const cacheKey = `${this.entityService.cacheKeyPrefix}-findAll-${JSON.stringify({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder
    })}`;

    const cached = await this.cacheManager.get<string>(cacheKey);
    if(cached){ 
      return parse(cached);
    }
    
    const result = await this.entityService.findAll({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
    });

    await trackFindAllKey(this.entityService.cacheKeyPrefix, cacheKey, this.cacheManager, 60_000);

    await this.cacheManager.set(cacheKey, stringify(result), 60_000);

    return result;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T | null> {
    const cacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;

    const cached = await this.cacheManager.get<string>(cacheKey);
    if(cached) return parse(cached);

    const result =  await this.entityService.findOne(id);

    if(result){ 
      await this.cacheManager.set(cacheKey, stringify(result), 60_000);
    }
    
    return result;
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any): Promise<T | null> {
    const updated = await this.entityService.update(id, updateDto);

    if(updated){
      const cacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;
      await this.cacheManager.set(cacheKey, stringify(updated), 60_000);

      await invalidateFindAllCache(this.entityService.cacheKeyPrefix, this.cacheManager);
    }

    return updated; 
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    const removal = await this.entityService.remove(id);
    
    if(removal) {
      const singleCacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;
      await this.cacheManager.del(singleCacheKey);

      await invalidateFindAllCache(this.entityService.cacheKeyPrefix, this.cacheManager);
    }

    return removal;
  }
}