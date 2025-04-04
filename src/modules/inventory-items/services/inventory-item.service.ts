import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryItemService extends ServiceBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    private readonly itemBuilder: InventoryItemBuilder,
  ){ super(itemRepo)}

  async create(createDto: CreateInventoryItemDto): Promise<InventoryItem | null> {
    const exist = await this.findOneByName(createDto.name);
    if(exist){ return null; }

    const item = await this.itemBuilder.buildCreateDto(createDto);
    return await this.itemRepo.save(item);
  }
  
  /**
   * If an entity id (item category, vendor) value is 0, its reference is being removed. 
   * If the value is null, its current value remains, and is not involved in the current update call.
   */
  async update(id: number, updateDto: UpdateInventoryItemDto): Promise<InventoryItem | null>{
    const toUpdate = await this.findOne(id);
    if(!toUpdate){ return null; }

    await this.itemBuilder.buildUpdateDto(toUpdate, updateDto);
    return await this.itemRepo.save(toUpdate);
  }

  async findOneByName(name: string, relations?: Array<keyof InventoryItem>): Promise<InventoryItem | null> {
    return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
  }
}