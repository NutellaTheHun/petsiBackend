import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';
import { ValidationException } from '../../../common/validation/validation-exception';
import { MenuItemDynamicPropertyValue } from '../../menu-items/entities/menu-item-dynamic-property-value.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';
import {
    DynamicPropertyConfig,
    HolderEntityType,
    ValueType,
} from '../entities/dynamic-property-config.entity';
import { getDynamicPropertiesTestingModule } from '../utils/dynamic-properties-testing.module';
import { DynamicPropertyConfigService } from './dynamic-property-config.service';

class TestableDynamicPropertyConfigService extends DynamicPropertyConfigService {
    async createEntityForTest(
        dto: CreateDynamicPropertyConfigDto,
        manager: EntityManager,
    ): Promise<DynamicPropertyConfig> {
        return this.createEntity(dto, manager);
    }

    async updateEntityForTest(
        dto: UpdateDynamicPropertyConfigDto,
        entity: DynamicPropertyConfig,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

describe('DynamicPropertyConfigService', () => {
    let service: TestableDynamicPropertyConfigService;
    let configRepo: Repository<DynamicPropertyConfig>;
    let categoryRepo: Repository<MenuItemCategory>;
    let menuItemRepo: Repository<MenuItem>;
    let dynPropValueRepo: Repository<MenuItemDynamicPropertyValue>;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;

    beforeAll(async () => {
        const module: TestingModule = await getDynamicPropertiesTestingModule({
            dynamicPropertyConfigServiceClass: TestableDynamicPropertyConfigService,
        });

        dbTestContext = new DatabaseTestContext();
        service = module.get(DynamicPropertyConfigService) as TestableDynamicPropertyConfigService;
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        dynPropValueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));
        dataSource = module.get(DataSource);

        await configRepo.deleteAll();

        dbTestContext.addCleanupFunction(async () => {
            await configRepo.deleteAll();
        });
        dbTestContext.addCleanupFunction(async () => {
            await menuItemRepo.delete({ name: '__lock_test_item__' });
        });
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('creates a config with valid fields and returns it with fieldRenderType', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            holderCategoryId: null,
            propertyName: 'Vegan Counterpart',
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
            valueEntityCategoryId: null,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.holderEntityType).toEqual(HolderEntityType.MenuItem);
            expect(result.propertyName).toEqual('Vegan Counterpart');
            expect(result.valueType).toEqual(ValueType.EntityReference);
            expect(result.valueEntityType).toEqual('menuItem');
            expect(result.fieldRenderType).toEqual('entity-select');
        });
    });

    it('creates a filepath config and derives fieldRenderType as file-upload', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            holderCategoryId: null,
            propertyName: 'Spec Sheet',
            valueType: ValueType.Filepath,
            valueEntityType: null,
            valueEntityCategoryId: null,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);
            expect(result.fieldRenderType).toEqual('file-upload');
        });
    });

    it('enforces propertyName uniqueness per holderEntityType', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: 'Unique Name Test',
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        await service.create(dto);

        const duplicate = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: 'Unique Name Test',
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        await expect(service.create(duplicate)).rejects.toThrow(ValidationException);
    });

    it('deletes a config and removes it from the database', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: 'To Be Deleted',
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        const created = await service.create(dto);
        const id = created.id;

        const removed = await service.remove(id);
        expect(removed).toBe(true);

        await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });

    it('returns config with fieldRenderType from findOne', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: 'Find One Test',
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
        });

        const created = await service.create(dto);
        const found = await service.findOne(created.id);

        expect(found.fieldRenderType).toEqual('entity-select');
    });

    it('updates a config and persists the changes', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: 'Before Update',
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        const created = await service.create(dto);

        const updateDto = plainToInstance(UpdateDynamicPropertyConfigDto, {
            propertyName: 'After Update',
        });

        const updated = await service.update(created.id, updateDto);
        expect(updated.propertyName).toEqual('After Update');
    });

    it('allows renaming propertyName when value rows exist', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: 'Lock Test Rename Prop',
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );

        const menuItem = await menuItemRepo.save({ name: '__lock_test_item__' });
        await dynPropValueRepo.save({ menuItem: { id: menuItem.id }, config: { id: config.id }, valueText: '/file' });

        const updated = await service.update(
            config.id,
            plainToInstance(UpdateDynamicPropertyConfigDto, { propertyName: 'Lock Test Rename Prop Updated' }),
        );
        expect(updated.propertyName).toEqual('Lock Test Rename Prop Updated');
    });

    it('returns 409 when changing a locked field with existing value rows', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: 'Lock Test Locked Field Prop',
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );

        const menuItem = await menuItemRepo.findOneByOrFail({ name: '__lock_test_item__' });
        await dynPropValueRepo.save({ menuItem: { id: menuItem.id }, config: { id: config.id }, valueText: '/file2' });

        const updateDto = plainToInstance(UpdateDynamicPropertyConfigDto, {
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
        });

        await expect(service.update(config.id, updateDto)).rejects.toThrow(
            expect.objectContaining({ status: HttpStatus.CONFLICT }),
        );
    });

    it('allows changing a structural field when no value rows exist', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: 'Lock Test No Values Prop',
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );

        const updated = await service.update(
            config.id,
            plainToInstance(UpdateDynamicPropertyConfigDto, {
                valueType: ValueType.EntityReference,
                valueEntityType: 'menuItem',
            }),
        );
        expect(updated.valueType).toEqual(ValueType.EntityReference);
    });
});
