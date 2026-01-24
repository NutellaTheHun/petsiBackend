import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';
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
  let sizeService: MenuItemSizeService;
  let dbTestContext: DatabaseTestContext;
  let dataSource: DataSource;

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
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(sizeService).toBeDefined();
  });

  it('should create a size', async () => {
    const dto = {
      name: 'test Size',
    } as CreateMenuItemSizeDto;

    const result = await sizeService.create(dto);
    expect(result).not.toBeNull();
    expect(result?.name).toEqual('test Size');

    testId = result?.id as number;
  });

  it('should find a size by id', async () => {
    const result = await sizeService.findOne(testId);
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual('test Size');
  });

  it('should find a size by name', async () => {
    const result = await sizeService.findOneByName('test Size');
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual('test Size');
  });

  it('should update a size', async () => {
    const dto = {
      name: 'updated test size',
    } as UpdateMenuItemSizeDto;

    const result = await sizeService.update(testId, dto);
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(testId);
    expect(result?.name).toEqual('updated test size');
  });

  it('should find all sizes', async () => {
    const results = await sizeService.findAll();
    expect(results.items.length).toEqual(5);
    testIds = results.items.slice(0, 3).map((size) => size.id);
  });

  it('should sort all sizes by name', async () => {
    const results = await sizeService.findAll({ sortBy: 'name' });
    expect(results.items.length).toEqual(5);
  });

  it('should find sizes by a list of ids', async () => {
    const results = await sizeService.findEntitiesById(testIds);
    expect(results.length).toEqual(3);
    for (const result of results) {
      expect(testIds.findIndex((id) => id === result.id)).not.toEqual(-1);
    }
  });

  it('should remove a size', async () => {
    const removal = await sizeService.remove(testId);
    expect(removal).toBeTruthy();

    await expect(sizeService.findOne(testId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
