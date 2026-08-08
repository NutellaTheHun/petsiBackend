import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import {
    createValidationErrorPayload,
    expectValidationErrorPayload,
    expectValidationErrorSize,
} from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MENU_ITEM_TYPES } from '../utils/menu-item-type';
import { MenuItemController } from './menu-item.controller';

const P = `t${Date.now()}`;

describe('menu item controller', () => {
    let testingUtil: MenuItemTestingUtil;
    let testCtx: DatabaseTestContext;
    let controller: MenuItemController;
    let itemRepo: Repository<MenuItem>;
    let categoryRepo: Repository<MenuItemCategory>;
    let sizeRepo: Repository<MenuItemSize>;
    let tenantRepo: Repository<Tenant>;
    let requestContext: TestRequestContextService;

    let tenant: Tenant;
    let categories: MenuItemCategory[];
    let sizes: MenuItemSize[];
    let singleItems: MenuItem[];
    let fixedContainerItems: MenuItem[];
    let varContainerItems: MenuItem[];

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        controller = module.get<MenuItemController>(MenuItemController);
        itemRepo = module.get(getRepositoryToken(MenuItem));
        categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
        sizeRepo = module.get(getRepositoryToken(MenuItemSize));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        requestContext = module.get(RequestContextService) as TestRequestContextService;

        tenant = await tenantRepo.save({ name: `${P}-tenant`, subdomain: `${P}-subdomain` });
        requestContext.setContext({ tenantId: tenant.id });

        ({ categories, sizes, singleItems, fixedContainerItems, varContainerItems } =
            await testingUtil.seedItems(P, tenant.id));
    });

    afterAll(async () => {
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

    it('create throws ValidationException when name already exists', async () => {
        const dto = plainToInstance(CreateMenuItemDto, {
            name: singleItems[0].name,
            type: MENU_ITEM_TYPES.SINGLE,
            categoryId: null,
            sizeIds: [sizes[0].id],
        });
        try {
            await controller.create(dto);
            throw new Error('expected ValidationException');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const err = e as ValidationException;
            expectValidationErrorSize(err.errors, 1);
            expectValidationErrorPayload(
                err.errors,
                [],
                createValidationErrorPayload('ALREADY_EXISTS', undefined, ['name']),
            );
        }
    });

    it('remove deletes a created item then findOne fails', async () => {
        const created = await controller.create(
            plainToInstance(CreateMenuItemDto, {
                name: `${P}-ctrl-remove-item`,
                type: MENU_ITEM_TYPES.SINGLE,
                categoryId: categories[0].id,
                sizeIds: [sizes[0].id],
            }),
        );
        testCtx.addCleanupFunction(async () => { await itemRepo.delete(created.id); });
        await controller.remove(created.id);
        await expect(controller.findOne(created.id)).rejects.toThrow(NotFoundException);
    });
});
