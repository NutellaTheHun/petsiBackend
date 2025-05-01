import { ObjectLiteral } from "typeorm";
import { ServiceBase } from "./service-base";
import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";

export class ControllerBase<T extends ObjectLiteral> {
  constructor(
    private readonly entityService: ServiceBase<T>
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
    return await this.entityService.findAll({
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T | null> {
    return await this.entityService.findOne(id);
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