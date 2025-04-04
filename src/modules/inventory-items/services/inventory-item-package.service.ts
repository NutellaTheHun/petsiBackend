import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
        private readonly packageBuilder: InventoryItemPackageBuilder,
    ){ super(packageRepo); }

    async create(createDto: CreateInventoryItemPackageDto): Promise<InventoryItemPackage | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists){ return null; }

        const packageType = await this.packageBuilder.buildCreateDto(createDto);
        return await this.packageRepo.save(packageType);
    }
      
    async update(id: number, updateDto: UpdateInventoryItemPackageDto): Promise<InventoryItemPackage | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null }

        this.packageBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.packageRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemPackage>): Promise<InventoryItemPackage | null> {
        return await this.packageRepo.findOne({ where: { name: name }, relations });
    }
}