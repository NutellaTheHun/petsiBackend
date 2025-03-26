import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemSizeService } from './inventory-item-size.service';
import { InventoryItemVendorService } from './inventory-item-vendor.service';
import { InventoryItemBuilder } from '../builders/inventory-item.builder';

@Injectable()
export class InventoryItemService extends ServiceBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    @Inject(forwardRef(() => InventoryItemCategoryService))
    private readonly categoryService: InventoryItemCategoryService,

    @Inject(forwardRef(() => InventoryItemSizeService))
    private readonly sizeService: InventoryItemSizeService,

    @Inject(forwardRef(() => InventoryItemVendorService))
    private readonly vendorService: InventoryItemVendorService,
    
    private readonly itemFactory: InventoryItemFactory,

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

  async findOneByName(name: string, relations?: string[]): Promise<InventoryItem | null> {
    return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
  }

  async initializeTestingDatabase(): Promise<void> {
    const items = await this.itemFactory.getTestingItems();

    for(const item of items){
      await this.create(this.itemFactory.createDtoInstance({
        name: item.name,
        inventoryItemCategoryId: item.category?.id,
        vendorId: item.vendor?.id, 
      }));
    }
  }
  
}
