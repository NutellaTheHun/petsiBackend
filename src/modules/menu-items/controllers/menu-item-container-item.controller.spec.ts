import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemContainerItemController } from './menu-item-container-item.controller';

const P = `t${Date.now()}`;

describe('menu item container item controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: MenuItemContainerItemController;
    let containerItemRepo: Repository<MenuItemContainerItem>;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let categories: MenuItemCategory[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];
    let sizes: MenuItemSize[];
    let containerLines: MenuItemContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        controller = module.get<MenuItemContainerItemController>(MenuItemContainerItemController);
        containerItemRepo = module.get(getRepositoryToken(MenuItemContainerItem));
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories, singleItems, fixedContainerItems, varContainerItems, sizes, containerLines } =
            await testingUtil.seedContainerLines(P, tenant.id));
    });

    afterAll(async () => {
        await containerItemRepo.delete(containerLines.map((l) => l.id));
        await itemRepo.delete([
            ...fixedContainerItems.map((i) => i.id),
            ...varContainerItems.map((i) => i.id),
            ...singleItems.map((i) => i.id),
        ]);
        await categoryRepo.delete(categories.map((c) => c.id));
        await sizeRepo.delete(sizes.map((s) => s.id));
        await tenantRepo.delete(tenant.id);
    });

    beforeEach(() => {
        testCtx = new DatabaseTestContext();
    });

    afterEach(async () => {
        await testCtx.executeCleanupFunctions();
    });

    it('findAll returns seeded containerLine in results', async () => {
        const result = await controller.findAll();
        const found = result.items.find((ci) => ci.id === containerLines[0].id);
        expect(found).toBeDefined();
    });

    it('findOne throws NotFoundException for nonexistent id', async () => {
        await expect(controller.findOne(9_999_999)).rejects.toThrow(NotFoundException);
    });
});
