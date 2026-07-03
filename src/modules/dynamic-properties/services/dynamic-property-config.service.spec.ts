import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { MenuItemDynamicPropertyValue } from '../../menu-items/entities/menu-item-dynamic-property-value.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
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

const P = `t${Date.now()}`;

describe('DynamicPropertyConfigService', () => {
    let service: TestableDynamicPropertyConfigService;
    let configRepo: Repository<DynamicPropertyConfig>;
    let menuItemRepo: Repository<MenuItem>;
    let dynPropValueRepo: Repository<MenuItemDynamicPropertyValue>;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;

    let lockTestMenuItem: MenuItem;

    beforeAll(async () => {
        const module: TestingModule = await getDynamicPropertiesTestingModule({
            dynamicPropertyConfigServiceClass: TestableDynamicPropertyConfigService,
        });

        service = module.get(DynamicPropertyConfigService) as TestableDynamicPropertyConfigService;
        configRepo = module.get(getRepositoryToken(DynamicPropertyConfig));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));
        dynPropValueRepo = module.get(getRepositoryToken(MenuItemDynamicPropertyValue));
        dataSource = module.get(DataSource);

        lockTestMenuItem = await menuItemRepo.save({ name: `${P}-lock-test-item` });
    });

    afterAll(async () => {
        await menuItemRepo.delete(lockTestMenuItem.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('creates a config with valid fields and returns it with fieldRenderType', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            holderCategoryId: null,
            propertyName: `${P}-vegan-counterpart`,
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
            valueEntityCategoryId: null,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);
            testCtx.addCleanupFunction(async () => { await configRepo.delete(result.id); });

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.holderEntityType).toEqual(HolderEntityType.MenuItem);
            expect(result.propertyName).toEqual(dto.propertyName);
            expect(result.valueType).toEqual(ValueType.EntityReference);
            expect(result.valueEntityType).toEqual('menuItem');
            expect(result.fieldRenderType).toEqual('entity-select');
        });
    });

    it('creates a filepath config and derives fieldRenderType as file-upload', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            holderCategoryId: null,
            propertyName: `${P}-spec-sheet`,
            valueType: ValueType.Filepath,
            valueEntityType: null,
            valueEntityCategoryId: null,
        });

        await dataSource.transaction(async (manager) => {
            const result = await service.createEntityForTest(dto, manager);
            testCtx.addCleanupFunction(async () => { await configRepo.delete(result.id); });
            expect(result.fieldRenderType).toEqual('file-upload');
        });
    });

    it('enforces propertyName uniqueness per holderEntityType', async () => {
        const propertyName = `${P}-unique-name-test`;
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName,
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        const created = await service.create(dto);
        testCtx.addCleanupFunction(async () => { await configRepo.delete(created.id); });

        const duplicate = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName,
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        await expect(service.create(duplicate)).rejects.toThrow(ValidationException);
    });

    it('deletes a config and removes it from the database', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: `${P}-to-be-deleted`,
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
            propertyName: `${P}-find-one-test`,
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
        });

        const created = await service.create(dto);
        testCtx.addCleanupFunction(async () => { await configRepo.delete(created.id); });

        const found = await service.findOne(created.id);

        expect(found.fieldRenderType).toEqual('entity-select');
    });

    it('updates a config and persists the changes', async () => {
        const dto = plainToInstance(CreateDynamicPropertyConfigDto, {
            holderEntityType: HolderEntityType.MenuItem,
            propertyName: `${P}-before-update`,
            valueType: ValueType.Filepath,
            valueEntityType: null,
        });

        const created = await service.create(dto);
        testCtx.addCleanupFunction(async () => { await configRepo.delete(created.id); });

        const updateDto = plainToInstance(UpdateDynamicPropertyConfigDto, {
            propertyName: `${P}-after-update`,
        });

        const updated = await service.update(created.id, updateDto);
        expect(updated.propertyName).toEqual(`${P}-after-update`);
    });

    it('allows renaming propertyName when value rows exist', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: `${P}-lock-test-rename-prop`,
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const value = await dynPropValueRepo.save({
            menuItem: { id: lockTestMenuItem.id },
            config: { id: config.id },
            valueText: '/file',
        });
        testCtx.addCleanupFunction(async () => { await dynPropValueRepo.delete(value.id); });

        const updated = await service.update(
            config.id,
            plainToInstance(UpdateDynamicPropertyConfigDto, { propertyName: `${P}-lock-test-rename-prop-updated` }),
        );
        expect(updated.propertyName).toEqual(`${P}-lock-test-rename-prop-updated`);
    });

    it('returns IMMUTABLE_FIELD validation error when changing a locked field with existing value rows', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: `${P}-lock-test-locked-field-prop`,
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

        const value = await dynPropValueRepo.save({
            menuItem: { id: lockTestMenuItem.id },
            config: { id: config.id },
            valueText: '/file2',
        });
        testCtx.addCleanupFunction(async () => { await dynPropValueRepo.delete(value.id); });

        const updateDto = plainToInstance(UpdateDynamicPropertyConfigDto, {
            valueType: ValueType.EntityReference,
            valueEntityType: 'menuItem',
        });

        let caught: ValidationException | undefined;
        try {
            await service.update(config.id, updateDto);
        } catch (e) {
            caught = e as ValidationException;
        }

        expect(caught).toBeInstanceOf(ValidationException);
        expect(caught!.errors.errorPayload).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ errorCode: 'IMMUTABLE_FIELD', fields: ['valueType'] }),
            ]),
        );
    });

    it('allows changing a structural field when no value rows exist', async () => {
        const config = await service.create(
            plainToInstance(CreateDynamicPropertyConfigDto, {
                holderEntityType: HolderEntityType.MenuItem,
                propertyName: `${P}-lock-test-no-values-prop`,
                valueType: ValueType.Filepath,
                valueEntityType: null,
            }),
        );
        testCtx.addCleanupFunction(async () => { await configRepo.delete(config.id); });

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
