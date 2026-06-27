import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';
import {
    DynamicPropertyConfig,
    HolderEntityType,
    ValueType,
} from '../entities/dynamic-property-config.entity';

@Injectable()
export class DynamicPropertyConfigBuilder extends BuilderBase<DynamicPropertyConfig> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(DynamicPropertyConfig, 'DynamicPropertyConfigBuilder', requestContextService, logger);
    }

    protected createEntity(dto: CreateDynamicPropertyConfigDto): void {
        if (dto.holderEntityType !== undefined) this.holderEntityType(dto.holderEntityType);
        if (dto.holderCategoryId !== undefined) this.holderCategoryById(dto.holderCategoryId);
        if (dto.propertyName !== undefined) this.propertyName(dto.propertyName);
        if (dto.valueType !== undefined) this.valueType(dto.valueType);
        if (dto.valueEntityType !== undefined) this.valueEntityType(dto.valueEntityType);
        if (dto.valueEntityCategoryId !== undefined) this.valueEntityCategoryById(dto.valueEntityCategoryId);
    }

    protected updateEntity(dto: UpdateDynamicPropertyConfigDto): void {
        if (dto.holderEntityType !== undefined) this.holderEntityType(dto.holderEntityType);
        if (dto.holderCategoryId !== undefined) this.holderCategoryById(dto.holderCategoryId);
        if (dto.propertyName !== undefined) this.propertyName(dto.propertyName);
        if (dto.valueType !== undefined) this.valueType(dto.valueType);
        if (dto.valueEntityType !== undefined) this.valueEntityType(dto.valueEntityType);
        if (dto.valueEntityCategoryId !== undefined) this.valueEntityCategoryById(dto.valueEntityCategoryId);
    }

    public holderEntityType(val: HolderEntityType): this {
        return this.setPropByVal('holderEntityType', val);
    }

    public holderCategoryById(id: number | null): this {
        if (id === null) return this.setPropByVal('holderCategory', null);
        return this.setPropById(
            async (id: number) => this.categoryRepo.findOne({ where: { id } }),
            'holderCategory',
            id,
        );
    }

    public propertyName(val: string): this {
        return this.setPropByVal('propertyName', val);
    }

    public valueType(val: ValueType): this {
        return this.setPropByVal('valueType', val);
    }

    public valueEntityType(val: string | null): this {
        return this.setPropByVal('valueEntityType', val);
    }

    public valueEntityCategoryById(id: number | null): this {
        if (id === null) return this.setPropByVal('valueEntityCategory', null);
        return this.setPropById(
            async (id: number) => this.categoryRepo.findOne({ where: { id } }),
            'valueEntityCategory',
            id,
        );
    }
}
