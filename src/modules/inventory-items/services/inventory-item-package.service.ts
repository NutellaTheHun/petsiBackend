import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { CreateInventoryItemPackageDto } from '../dto/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemPackageValidator } from '../validators/inventory-item-package.validator';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
        packageBuilder: InventoryItemPackageBuilder,
        validator: InventoryItemPackageValidator,
    ){ super(packageRepo, packageBuilder, validator, 'InventoryItemPackageService'); }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemPackage>): Promise<InventoryItemPackage | null> {
        return await this.packageRepo.findOne({ where: { name: name }, relations });
    }
}