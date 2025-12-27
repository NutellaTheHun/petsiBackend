import { Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemPackageDto } from '../dto/inventory-item-package/create-inventory-item-package.dto';
import { UpdateInventoryItemPackageDto } from '../dto/inventory-item-package/update-inventory-item-package.dto';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';

@Injectable()
export class InventoryItemPackageBuilder extends BuilderBase<InventoryItemPackage> {
  constructor(requestContextService: RequestContextService, logger: AppLogger) {
    super(
      InventoryItemPackage,
      'InventoryItemPackageBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateInventoryItemPackageDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }
  protected updateEntity(dto: UpdateInventoryItemPackageDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('packageName', name);
  }
}
