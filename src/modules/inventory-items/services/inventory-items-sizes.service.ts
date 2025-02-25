import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { CreateInventoryItemSizeDto } from '../dto/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/update-inventory-item-size.dto';
import { InventoryItemSizeFactory } from '../factories/inventory-item-size.factory';

@Injectable()
export class InventoryItemSizesService {
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly sizeRepo: Repository<InventoryItemSize>,
    
        private readonly sizeFactory: InventoryItemSizeFactory
    
    ){}

    async create(createDto: CreateInventoryItemSizeDto)/*: Promise< | null> */{

    }
    
    async findAll(relations?: string[])/*: Promise<[]>*/{

    }
    
    async findOne(id: number, relations?: string[])/*: Promise< | null>*/{

    }
    
    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
    
    async findsById( Ids: number[], relations?: string[])/*: Promise<[]> */{

    }
    
    async update(id: number, updateDto: UpdateInventoryItemSizeDto)/*: Promise< | null>*/{

    }
    
    async remove(id: number)/*: Promise<Boolean> */{

    }
    
    createQueryBuilder()/*: QueryBuilder<> */{

    }
}
