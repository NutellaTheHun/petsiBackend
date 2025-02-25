import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItemFactory } from '../factories/inventory-item.factory';

@Injectable()
export class InventoryItemsService {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly inventoryItemRepo: Repository<InventoryItem>,
    
        private readonly inventoryItemFactory: InventoryItemFactory
    
      ){}

      async create(createDto: CreateInventoryItemDto)/*: Promise< | null> */{

        }
      
        async findAll(relations?: string[])/*: Promise<[]>*/{

        }
      
        async findOne(id: number, relations?: string[])/*: Promise< | null>*/{

        }
      
        async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

        }
      
        async findsById( Ids: number[], relations?: string[])/*: Promise<[]> */{

        }
      
        async update(id: number, updateDto: UpdateInventoryItemDto)/*: Promise< | null>*/{

        }
      
        async remove(id: number)/*: Promise<Boolean> */{

        }
      
        createQueryBuilder()/*: QueryBuilder<> */{

        }
}
