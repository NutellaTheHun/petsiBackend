import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { InventoryItemPackageFactory } from '../factories/inventory-item-package.factory';
import { ServiceBase } from '../../../base/service-base';

@Injectable()
export class InventoryItemPackagesService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
    
        private readonly packageFactory: InventoryItemPackageFactory 
    
    ){ super(packageRepo); }

    async create(createDto: CreateInventoryItemPackageDto)/*: Promise< | null> */{

    }
      
    async update(id: number, updateDto: UpdateInventoryItemPackageDto)/*: Promise< | null>*/{

    }

    async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

    }
}
