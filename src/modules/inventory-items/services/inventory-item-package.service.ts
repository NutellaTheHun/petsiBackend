import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { InventoryItemPackageBuilder } from '../builders/inventory-item-package.builder';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';

@Injectable()
export class InventoryItemPackageService extends ServiceBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly repo: Repository<InventoryItemPackage>,

        builder: InventoryItemPackageBuilder,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'InventoryItemPackageService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof InventoryItemPackage>): Promise<InventoryItemPackage | null> {
        return await this.repo.findOne({ where: { packageName: name }, relations });
    }
}