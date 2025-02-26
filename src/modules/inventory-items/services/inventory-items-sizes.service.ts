import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';
import { ServiceBase } from '../../../base/service-base';

@Injectable()
export class InventoryItemSizesService extends ServiceBase<InventoryItemSize>{
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,

        private readonly sizeFactory: InventoryItemSizeFactory

    ){ super(sizeRepo); }

    async create(createDto: CreateInventoryItemSizeDto)/*: Promise< | null> */{

    }
      
    async update(id: number, updateDto: UpdateInventoryItemSizeDto)/*: Promise< | null>*/{

    }

    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
}
