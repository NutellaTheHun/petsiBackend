import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { InventoryItemPackageFactory } from '../factories/inventory-item-package.factory';

@Injectable()
export class InventoryItemPackagesService {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
    
        private readonly packageFactory: InventoryItemPackageFactory 
    
      ){}

      async create(createDto: CreateInventoryItemPackageDto)/*: Promise< | null> */{

        }
      
        async findAll(relations?: string[])/*: Promise<[]>*/{

        }
      
        async findOne(id: number, relations?: string[])/*: Promise< | null>*/{

        }
      
        async findOneByName(Name: string, relations?: string[])/*: Promise< | null>*/ {

        }
      
        async findsById( Ids: number[], relations?: string[])/*: Promise<[]> */{

        }
      
        async update(id: number, updateDto: UpdateInventoryItemPackageDto)/*: Promise< | null>*/{

        }
      
        async remove(id: number)/*: Promise<Boolean> */{

        }
      
        createQueryBuilder()/*: QueryBuilder<> */{

        }
}
