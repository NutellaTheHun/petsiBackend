import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { SIZE_ONE } from '../utils/constants';
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
describe('menu item size service', () => {
    let testingUtil: MenuItemTestingUtil;
    let sizeService: TestableMenuItemSizeService;
    let dbTestContext: DatabaseTestContext;
    let dataSource: DataSource;
    let sizeRepo: Repository<MenuItemSize>;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule({
            menuItemSizeServiceClass: TestableMenuItemSizeService,
        });
        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemSizeTestDatabase(dbTestContext);
        dataSource = module.get(DataSource);
        sizeService = module.get(
            MenuItemSizeService,
        ) as TestableMenuItemSizeService;
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(sizeService).toBeDefined();
    });

    // test createEntity()
    it('should create size', async () => {
        const dto = plainToInstance(CreateMenuItemSizeDto, { name: 'x-large' });

        await dataSource.transaction(async (manager) => {
            const result = await sizeService.createEntityForTest(dto, manager);

            expect(result).not.toBeNull();
            expect(result?.id).not.toBeNull();
            expect(result.name).toEqual(dto.name);
        });
    });

    // test updateEntity()
    it('should update size', async () => {
        const size = await sizeRepo.findOne({ where: { name: SIZE_ONE } });
        if (!size) throw new Error('size not found');

        const dto = plainToInstance(UpdateMenuItemSizeDto, { name: 'Size One Updated' });

        await dataSource.transaction(async (manager) => {
            await sizeService.updateEntityForTest(dto, size, manager);
        });

        const result = await sizeRepo.findOne({ where: { id: size.id } });
        if (!result) throw new Error('result not found');
        expect(result.name).toEqual(dto.name);
    });

    // test findAll()
    it('should find all sizes', async () => {
        const repoResult = await sizeRepo.find();
        const serviceResult = await sizeService.findAll();
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
    });

    // test findall() with sort by name
    it('should find all sizes with sort by name', async () => {
        const repoResult = await sizeRepo.find({ order: { name: 'DESC' } });
        const serviceResult = await sizeService.findAll({
            sortBy: 'name',
            sortOrder: 'DESC',
        });
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.items.length).toEqual(repoResult.length);
        if (repoResult.length > 0) {
            expect(serviceResult?.items[0].name).toEqual(repoResult[0].name);
        }
    });

    // test findOne()
    it('should find one size', async () => {
        const size = await sizeRepo.find({ take: 1 });
        if (!size.length) throw new Error('size not found');

        const serviceResult = await sizeService.findOne(size[0].id);
        expect(serviceResult).not.toBeNull();
        expect(serviceResult?.id).toEqual(size[0].id);
    });

    // test remove()
    it('should remove size', async () => {
        const size = await sizeRepo.find({ take: 1 });
        if (!size.length) throw new Error('size not found');
        const id = size[0].id;

        const deleteResult = await sizeService.remove(id);
        expect(deleteResult).toBe(true);
        await expect(sizeService.findOne(id)).rejects.toThrow(NotFoundException);
    });
});
