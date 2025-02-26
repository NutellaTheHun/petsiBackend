import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorFactory } from '../factories/inventory-item-vendor.factory';
import { CreateInventoryItemVendorDto } from '../dto/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/update-inventory-item-vendor.dto';

@Injectable()
export class InventoryItemVendorsService {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly categoryRepo: Repository<InventoryItemVendor>,
    
        private readonly categoryFactory: InventoryItemVendorFactory
    
    ){}

    async create(createDto: CreateInventoryItemVendorDto)/*: Promise< | null> */{

    }
    
    async findAll(relations?: string[])/*: Promise<[]>*/{

    }
    
    async findOne(id: number, relations?: string[])/*: Promise< | null>*/{

    }
    
    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
    
    async findsById( Ids: number[], relations?: string[])/*: Promise<[]> */{

    }
    
    async update(id: number, updateDto: UpdateInventoryItemVendorDto)/*: Promise< | null>*/{

    }
    
    async remove(id: number)/*: Promise<Boolean> */{

    }
    
    createQueryBuilder()/*s: QueryBuilder<> */{

    }
}