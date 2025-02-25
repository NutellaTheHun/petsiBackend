import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { UpdateInventoryItemCategoryDto } from '../dto/update-inventory-item-category.dto';
import { CreateInventoryItemCategoryDto } from '../dto/create-inventory-item-category.dto';
import { InventoryItemCategoryFactory } from '../factories/inventory-item-category.factory';

@Injectable()
export class InventoryItemCategoriesService {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly categoryRepo: Repository<InventoryItemCategory>,
    
        private readonly categoryFactory: InventoryItemCategoryFactory
    
    ){}

    async create(createDto: CreateInventoryItemCategoryDto)/*: Promise< | null> */{

    }
    
    async findAll(relations?: string[])/*: Promise<[]>*/{

    }
    
    async findOne(id: number, relations?: string[])/*: Promise< | null>*/{

    }
    
    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
    
    async findsById( Ids: number[], relations?: string[])/*: Promise<[]> */{

    }
    
    async update(id: number, updateDto: UpdateInventoryItemCategoryDto)/*: Promise< | null>*/{

    }
    
    async remove(id: number)/*: Promise<Boolean> */{

    }
    
    createQueryBuilder()/*s: QueryBuilder<> */{

    }
}
