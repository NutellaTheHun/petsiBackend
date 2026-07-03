import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { menuItemSizeToUpdateDto } from '../utils/entity-transformers/menu-item-size.dto.transfomer';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemSizeService } from './menu-item-size.service';

class TestableMenuItemSizeService extends MenuItemSizeService {
    async createEntityForTest(
        dto: CreateMenuItemSizeDto,
        manager: EntityManager,
    ): Promise<MenuItemSize> {
        return this.createEntity(dto, manager);
    }
    async updateEntityForTest(
        dto: UpdateMenuItemSizeDto,
        entity: MenuItemSize,
        manager: EntityManager,
    ): Promise<void> {
        return this.updateEntity(dto, manager, entity);
    }
}

const P = `t${Date.now()}`;

describe('menu item size service', () => {
    let testingUtil: MenuItemTestingUtil;
    let service: TestableMenuItemSizeService;
    let testCtx: DatabaseTestContext;
    let dataSource: DataSource;
    let sizeRepo: Repository<MenuItemSize>;

    let sizes: MenuItemSize[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemSizeServiceClass: TestableMenuItemSizeService,
        });
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        service = module.get<MenuItemSizeService>(
            MenuItemSizeService,
        ) as TestableMenuItemSizeService;
        dataSource = module.get(DataSource);
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));

        ({ sizes } = await testingUtil.seedSizes(P));
    });

    afterAll(async () => {
        await sizeRepo.delete(sizes.map((s) => s.id));
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    describe('size lifecycle', () => {
        let created: MenuItemSize;

        it('should create size', async () => {
            const dto = plainToInstance(CreateMenuItemSizeDto, { name: `${P}-create-test` });
            await dataSource.transaction(async (manager) => {
                created = await service.createEntityForTest(dto, manager);
            });
            expect(created.id).toBeDefined();
            expect(created.name).toBe(dto.name);
            testCtx.addCleanupFunction(async () => { await sizeRepo.delete(created.id); });
        });

        it('should update size', async () => {
            const dto = plainToInstance(UpdateMenuItemSizeDto, { name: `${P}-create-updated` });
            await dataSource.transaction(async (manager) => {
                await service.updateEntityForTest(dto, created, manager);
            });
            const reloaded = await sizeRepo.findOneOrFail({ where: { id: created.id } });
            expect(reloaded.name).toBe(`${P}-create-updated`);
        });

        it('should remove size', async () => {
            await service.remove(created.id);
            await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
        });
    });

    it('should find seeded size in findAll results', async () => {
        const result = await service.findAll();
        const found = result.items.find((s) => s.id === sizes[0].id);
        expect(found).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(service.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });

    describe('change detector on update', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(MenuItemSizeService.prototype as any, 'updateEntity');
        });

        afterEach(() => {
            spy.mockRestore();
        });

        it('skips updateEntity when name unchanged', async () => {
            const size = sizes[0];
            const dto = menuItemSizeToUpdateDto(size);
            await service.update(size.id, dto);
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls updateEntity when name changes', async () => {
            const size = sizes[1];
            const dto = menuItemSizeToUpdateDto(size, { name: `${P}-size-renamed` });
            await service.update(size.id, dto);
            expect(spy).toHaveBeenCalled();
            const row = await sizeRepo.findOneOrFail({ where: { id: size.id } });
            expect(row.name).toBe(`${P}-size-renamed`);
        });
    });
});
