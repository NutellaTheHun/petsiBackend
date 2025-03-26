import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { InventoryItemPackageFactory } from '../factories/inventory-item-package.factory';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
    
        private readonly packageFactory: InventoryItemPackageFactory,
        private readonly packageBuilder: InventoryItemPackageBuilder,

    ){ super(packageRepo); }

    async create(createDto: CreateInventoryItemPackageDto): Promise<InventoryItemPackage | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists){ return null; }

        const packageType = this.packageBuilder.buildCreateDto(createDto);

        return await this.packageRepo.save(packageType);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemPackageDto): Promise<InventoryItemPackage | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null }

        this.packageBuilder.buildUpdateDto(toUpdate, updateDto);

        return await this.packageRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<InventoryItemPackage | null> {
        return await this.packageRepo.findOne({ where: { name: name }, relations });
    }

    async initializeTestingDatabase(): Promise<void> {
        const defaultPackages = await this.packageFactory.getTestingPackages();

        for(const pkg of defaultPackages){
            await this.create(
              this.packageFactory.createDtoInstance({ name: pkg.name })
            )
          }
    } 
}
