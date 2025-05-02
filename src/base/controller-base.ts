import { ObjectLiteral } from "typeorm";
import { ServiceBase } from "./service-base";
import { Body, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

export class ControllerBase<T extends ObjectLiteral> {
  constructor(
    private readonly entityService: ServiceBase<T>,

    @Inject(CACHE_MANAGER) 
    private readonly cacheManager: Cache
  ) {}

  @Post()
  async create(@Body() createDto: any): Promise<T | null> {
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

    const cached = await this.cacheManager.get<{ items: T[], nextCursor?: string }>(cacheKey);
    if (cached) return cached;

    const result = await this.entityService.findAll({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
    });

    await this.cacheManager.set(cacheKey, result, 60_000);

    return result;
    /*return await this.entityService.findAll({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
    });*/
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T | null> {
    const cacheKey = `${this.entityService.cacheKeyPrefix}-findOne-${id}`;

    const cached = await this.cacheManager.get<T>(cacheKey);
    if(cached) return cached;

    const result =  await this.entityService.findOne(id);

    if(result){ 
      await this.cacheManager.set(cacheKey, result, 60_000);
    }
    
    return result;
    //return await this.entityService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any): Promise<T | null> {
    return await this.entityService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    return await this.entityService.remove(id);
  }
}