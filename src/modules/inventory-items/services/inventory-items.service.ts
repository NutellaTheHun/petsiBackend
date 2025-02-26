import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItemFactory } from '../factories/inventory-item.factory';
import { ServiceBase } from '../../../base/service-base';

@Injectable()
export class InventoryItemsService extends ServiceBase<InventoryItem> {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    private readonly itemFactory: InventoryItemFactory
  
  ){ super(itemRepo)}

  async create(createDto: CreateInventoryItemDto)/*: Promise< | null> */{

  }
      
  async update(id: number, updateDto: UpdateInventoryItemDto)/*: Promise< | null>*/{

  }

  async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

  }
  
}
