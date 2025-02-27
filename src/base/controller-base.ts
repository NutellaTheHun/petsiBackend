import { ObjectLiteral } from "typeorm";
import { ServiceBase } from "./service-base";
import { Body, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";

export class ControllerBase<T extends ObjectLiteral> {
  constructor(
    private readonly entityService: ServiceBase<T>
  ) {}

  @Post()
  async create(@Body() createRoleDto: any): Promise<T | null> {
    return await this.entityService.create(createRoleDto);
  }

  @Get()
  async findAll(): Promise<T[]> {
    return await this.entityService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T | null> {
    return await this.entityService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: any): Promise<T | null> {
    return await this.entityService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    return await this.entityService.remove(id);
  }
}