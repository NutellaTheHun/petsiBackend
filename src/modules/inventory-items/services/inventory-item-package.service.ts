import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemPackageValidator } from '../validators/inventory-item-package.validator';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,
        packageBuilder: InventoryItemPackageBuilder,
        validator: InventoryItemPackageValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(packageRepo, packageBuilder, validator, 'InventoryItemPackageService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemPackage>): Promise<InventoryItemPackage | null> {
        return await this.packageRepo.findOne({ where: { packageName: name }, relations });
    }
}