import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { UpdateChildOrderContainerItemDto } from "../../orders/dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";
import { UpdateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-child-menu-item-container-item.dto";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";
import { MenuItemContainerOptionsService } from "../services/menu-item-container-options.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { CAT_BLUE, item_a, item_b, SIZE_THREE } from "../utils/constants";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemTestingUtil } from "../utils/menu-item-testing.util";
import { MenuItemValidator } from "./menu-item.validator";

describe('menu item validator', () => {
    let testingUtil: MenuItemTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: MenuItemValidator;
    let itemService: MenuItemService;
    let categoryService: MenuItemCategoryService;
    let sizeService: MenuItemSizeService;
    let definedContainerService: MenuItemContainerItemService;
    let containerOptionsService: MenuItemContainerOptionsService;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();
        validator = module.get<MenuItemValidator>(MenuItemValidator);

        itemService = module.get<MenuItemService>(MenuItemService);
        categoryService = module.get<MenuItemCategoryService>(MenuItemCategoryService);
        sizeService = module.get<MenuItemSizeService>(MenuItemSizeService);
        definedContainerService = module.get<MenuItemContainerItemService>(MenuItemContainerItemService);
        containerOptionsService = module.get<MenuItemContainerOptionsService>(MenuItemContainerOptionsService);

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

    it('should validate create: normal', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const vegan = await itemService.findOneByName(item_b);
        if(!vegan){ throw new Error();}

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const dto = {
            categoryId: category?.id,
            itemName: "TEST ITEM",
            veganOptionMenuId: vegan.id,
            validSizeIds: [size.id],
            isParbake: true,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should validate create: defined container', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_b, ['validSizes']);
        if(!containedItemB){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemB.id,
                containedMenuItemSizeId: containedItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
        ] as CreateChildMenuItemContainerItemDto[];

        const dto = {
            categoryId: category.id,
            itemName: "TEST ITEM",
            validSizeIds: [size.id],
            definedContainerItemDtos: containerDtos,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should validate create: container options', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            categoryId: category.id,
            itemName: "testNAME",
            validSizeIds: [size.id],
            containerOptionDto: optionDto,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create (name already exists)', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const vTnBake = await itemService.findOneByName(item_b);
        if(!vTnBake){ throw new Error(); }

        const dto = {
            categoryId: category.id,
            itemName: item_a,
            veganTakeNBakeOptionMenuId: vTnBake.id,
            validSizeIds: [size.id],
            isParbake: true,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Menu item with name ${item_a} already exists`);
    });

    it('should fail create: definedContainer and container options', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_b, ['validSizes']);
        if(!containedItemB){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemB.id,
                containedMenuItemSizeId: containedItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
        ] as CreateChildMenuItemContainerItemDto[];

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            categoryId: category.id,
            itemName: "TST ITEM",
            validSizeIds: [size.id],
            definedContainerItemDtos: containerDtos,
            containerOptionDto: optionDto,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Cannot create MenuItem with both containerOptions and definedContainerItems`);
    });

    it('should fail create: definedContainer duplicates', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
        ] as CreateChildMenuItemContainerItemDto[];

        const dto = {
            categoryId: category.id,
            itemName: "TEST NAME",
            validSizeIds: [size.id],
            definedContainerItemDtos: containerDtos,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`defined container has duplicate parentContainerSize / containedItem / containedItemSize combination`);
    });

    it('should fail create: duplicate size ids', async () => {
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const dto = {
            categoryId: category.id,
            itemName: "TEST ITEM",
            validSizeIds: [ size.id, size.id ],
            isParbake: true,
        } as CreateMenuItemDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`menu item to create has duplicate item size ids`);
    });

    it('should pass update: normal', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const dto = {
            categoryId: category.id,
            itemName: "UPDATE ITEM",
            validSizeIds: [size.id],
            isPOTM: true,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should pass update: defined container', async () => {
        const containerRequest = await definedContainerService.findAll({ relations: ['parentContainer'] })
        if(!containerRequest){ throw new Error(); }

        const toUpdate = containerRequest.items[0].parentContainer;
        
        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_b, ['validSizes']);
        if(!containedItemB){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'update',
                id: containerRequest.items[0].id,
                parentContainerMenuItemId: toUpdate.id,
                containedMenuItemId: containedItemB.id,
                containedMenuItemSizeId: containedItemB.validSizes[0].id,
                quantity: 1,
            } as UpdateChildMenuItemContainerItemDto,
        ] as (CreateChildMenuItemContainerItemDto | UpdateChildMenuItemContainerItemDto)[];

        const dto = {
            categoryId: category.id,
            itemName: "UPDATE NAME",
            validSizeIds: [size.id],
            isParbake: true,
            definedContainerItemDtos: containerDtos,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should pass update: container options', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            categoryId: category.id,
            itemName: "UPDATE ITEM",
            validSizeIds: [size.id],
            isParbake: true,
            containerOptionDto: optionDto,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update (name already exists)', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const dto = {
            categoryId: category.id,
            itemName: item_b,
            validSizeIds: [size.id],
            isParbake: true,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Menu item with name ${dto.itemName} already exists`);
    });

    it('should fail update: container options and defined container', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

        const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_b, ['validSizes']);
        if(!containedItemB){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemB.id,
                containedMenuItemSizeId: containedItemB.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
        ] as CreateChildMenuItemContainerItemDto[];

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            categoryId: category.id,
            itemName: "TEST UPDATE",
            validSizeIds: [size.id],
            isParbake: true,
            definedContainerItemDtos: containerDtos,
            containerOptionDto: optionDto,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Cannot create MenuItem with both containerOptions and definedContainerItems`);
    });

    it('should fail update: container options with current defined container', async () => {
        const containerItemRequest = await definedContainerService.findAll({ relations: ['parentContainer'] })
        if(!containerItemRequest) { throw new Error(); }

        const toUpdate = containerItemRequest.items[0].parentContainer

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            containerOptionDto: optionDto,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`current item has a defined container, must set to null before updating with containerOptions`);
    });

    it('should pass update: container options with current defined container (set null)', async () => {
        const containerItemRequest = await definedContainerService.findAll({ relations: ['parentContainer'] })
        if(!containerItemRequest) { throw new Error(); }

        const toUpdate = containerItemRequest.items[0].parentContainer

        const optionDto = {
            mode: 'create',
            containerRuleDtos: [],
            validQuantity: 1,
        } as CreateChildMenuItemContainerOptionsDto;

        const dto = {
            containerOptionDto: optionDto,
            definedContainerItemDtos: null,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull;
    });

    it('should fail update: defined container with current container options', async () => {
        const optionsRequest = await containerOptionsService.findAll({ relations: ['parentContainer'] });
        if(!optionsRequest){ throw new Error(); }

        const toUpdate = optionsRequest.items[0].parentContainer;

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_b, ['validSizes']);
        if(!containedItemB){ throw new Error(); }


        const containerDtos = [
        ] as (CreateChildMenuItemContainerItemDto | UpdateChildOrderContainerItemDto)[];

        const dto = {
            definedContainerItemDtos: containerDtos,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`current item has containerOptions, must set to null before updating with defined container`);
    });

    it('should pass update: defined container with current container options (Set null)', async () => {
        const optionsRequest = await containerOptionsService.findAll({ relations: ['parentContainer'] });
        if(!optionsRequest){ throw new Error(); }

        const toUpdate = optionsRequest.items[0].parentContainer;

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containedItemB = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemB){ throw new Error(); }


        const containerDtos = [
        ] as (CreateChildMenuItemContainerItemDto | UpdateChildOrderContainerItemDto)[];

        const dto = {
            definedContainerItemDtos: containerDtos,
            containerOptionDto: null,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: defined container duplicates', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const containedItemA = await itemService.findOneByName(item_a, ['validSizes']);
        if(!containedItemA){ throw new Error(); }

        const containerDtos = [
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
            {
                mode: 'create',
                parentContainerSizeId: size.id,
                containedMenuItemId: containedItemA.id,
                containedMenuItemSizeId: containedItemA.validSizes[0].id,
                quantity: 1,
            } as CreateChildMenuItemContainerItemDto,
        ] as (CreateChildMenuItemContainerItemDto | UpdateChildMenuItemContainerItemDto)[];

        const dto = {
            definedContainerItemDtos: containerDtos,
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`defined container has duplicate parentContainerSize / containedItem / containedItemSize combination`);
    });

    it('should fail update: duplicate validSizes', async () => {
        const toUpdate = await itemService.findOneByName(item_a);
        if(!toUpdate){ throw new Error(); }

         const category = await categoryService.findOneByName(CAT_BLUE);
        if(!category){ throw new Error(); }

        const size = await sizeService.findOneByName(SIZE_THREE);
        if(!size){ throw new Error(); }

        const dto = {
            validSizeIds: [size.id, size.id],
        } as UpdateMenuItemDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`menu item to create has duplicate item size ids`);
    });
});