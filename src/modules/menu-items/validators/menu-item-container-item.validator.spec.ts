import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";
import { UpdateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-child-menu-item-container-item.dto";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { item_a, item_c, SIZE_FOUR } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemContainerItemValidator } from "./menu-item-container-item.validator";
import { ValidationException } from "../../../util/exceptions/validation-exception";
import { INVALID } from "../../../util/exceptions/error_constants";

describe('menu item container item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemContainerItemValidator;
    let containerService: MenuItemContainerItemService;
    let itemService: MenuItemService;
    let sizeService: MenuItemSizeService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemContainerItemValidator>(MenuItemContainerItemValidator);
        containerService = module.get<MenuItemContainerItemService>(MenuItemContainerItemService);
        itemService = module.get<MenuItemService>(MenuItemService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
        await testingUtil.initMenuItemContainerTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if (!parentContainer) { throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerId: parentContainer.id,
            parentContainerSizeId: parentContainer.validSizes[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: containedItem.validSizes[0].id,
            quantity: 1,
        } as CreateChildMenuItemContainerItemDto;

        await validator.validateCreate(dto);
    });

    it('should fail create: invalid size for item', async () => {
        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if (!parentContainer) { throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if (!badSize) { throw new Error(); }

        const dto = {
            mode: 'create',
            parentContainerId: parentContainer.id,
            parentContainerSizeId: parentContainer.validSizes[0].id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 1,
        } as CreateChildMenuItemContainerItemDto;

        try {
            await validator.validateCreate(dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should pass update', async () => {
        const toUpdateRequest = await containerService.findAll();
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const parentContainer = await itemService.findOneByName(item_c, ['validSizes']);
        if (!parentContainer) { throw new Error(); }

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: containedItem.validSizes[0].id,
            quantity: 2,
        } as UpdateChildMenuItemContainerItemDto;

        await validator.validateUpdate(toUpdate.id, dto);
    });

    it('should fail update: new item with no sizing', async () => {
        const toUpdateRequest = await containerService.findAll();
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail update: invalid contained item and size', async () => {
        const toUpdateRequest = await containerService.findAll();
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if (!badSize) { throw new Error(); }


        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemId: containedItem.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });

    it('should fail update: invalid size for currentItem', async () => {
        const toUpdateRequest = await containerService.findAll({ relations: ['containedItem'] });
        if (!toUpdateRequest) { throw new Error(); }

        const toUpdate = toUpdateRequest.items[0];

        const containedItem = await itemService.findOneByName(item_a, ['validSizes']);
        if (!containedItem) { throw new Error(); }

        const badSize = await sizeService.findOneByName(SIZE_FOUR);
        if (!badSize) { throw new Error(); }

        const dto = {
            mode: 'update',
            id: toUpdate.id,
            containedMenuItemSizeId: badSize.id,
            quantity: 3,
        } as UpdateChildMenuItemContainerItemDto;

        try {
            await validator.validateUpdate(toUpdate.id, dto);
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationException);
            const error = err as ValidationException;
            expect(error.errors.length).toEqual(1);
            expect(error.errors[0].errorType).toEqual(INVALID);
        }
    });
});