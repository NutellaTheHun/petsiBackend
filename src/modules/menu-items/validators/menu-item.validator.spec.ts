import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemSize } from '../entities/menu-item-size.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { CAT_BLUE, item_a, item_b, SIZE_THREE } from '../utils/constants';
import { getMenuItemTestingModule } from '../utils/menu-item-testing.module';
import { MenuItemTestingUtil } from '../utils/menu-item-testing.util';
import { MenuItemValidator } from './menu-item.validator';

describe('menu item validator', () => {
  let testingUtil: MenuItemTestingUtil;
  let dbTestContext: DatabaseTestContext;
  let validator: MenuItemValidator;
  let itemRepo: Repository<MenuItem>;
  let categoryRepo: Repository<MenuItemCategory>;
  let sizeRepo: Repository<MenuItemSize>;
  let itemContainerRepo: Repository<MenuItemContainerItem>;

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<MenuItemTestingUtil>(MenuItemTestingUtil);
    await testingUtil.initMenuItemContainerItemTestDatabase(dbTestContext);

    validator = module.get<MenuItemValidator>(MenuItemValidator);

    itemRepo = module.get(getRepositoryToken(MenuItem));
    categoryRepo = module.get(getRepositoryToken(MenuItemCategory));
    sizeRepo = module.get(getRepositoryToken(MenuItemSize));
    itemContainerRepo = module.get(getRepositoryToken(MenuItemContainerItem));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create: normal', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const vegan = await itemService.findOneByName(item_b);
    if (!vegan) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const dto = {
      categoryId: category?.id,
      name: 'TEST ITEM',
      veganOptionMenuId: vegan.id,
      sizeIds: [size.id],
      isParbake: true,
    } as CreateMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should validate create: defined container', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const containedItemA = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItemA) {
      throw new Error();
    }

    const containedItemB = await itemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!containedItemB) {
      throw new Error();
    }

    const containerDtos = [
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: size.id,
          containedMenuItemId: containedItemA.id,
          containedMenuItemSizeId: containedItemA.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: size.id,
          containedMenuItemId: containedItemB.id,
          containedMenuItemSizeId: containedItemB.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      categoryId: category.id,
      name: 'TEST ITEM',
      sizeIds: [size.id],
      definedContainerItemDtos: containerDtos,
    } as CreateMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should validate create: container options', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const optionDto = plainToInstance(NestedMenuItemContainerOptionsDto, {
      mode: 'create',
      createDto: {
        containerRuleDtos: [],
        validQuantity: 1,
      },
    });

    const dto = {
      categoryId: category.id,
      name: 'testNAME',
      sizeIds: [size.id],
      containerOptionDto: optionDto,
    } as CreateMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create (name already exists)', async () => {
    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const vTnBake = await itemService.findOneByName(item_b);
    if (!vTnBake) {
      throw new Error();
    }

    const dto = {
      categoryId: category.id,
      name: item_a,
      veganTakeNBakeOptionMenuId: vTnBake.id,
      sizeIds: [size.id],
      isParbake: true,
    } as CreateMenuItemDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.children[0].field).toEqual('itemName');
  });

  /*it('should fail create: ContainerItem validator', async () => {
    throw new NotImplementedException();
  });

  it('should fail create: containerOptions validator', async () => {
    throw new NotImplementedException();
  });*/

  it('should pass update: normal', async () => {
    const toUpdate = await itemService.findOneByName(item_a);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const dto = {
      categoryId: category.id,
      name: 'UPDATE ITEM',
      sizeIds: [size.id],
      isPOTM: true,
    } as UpdateMenuItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should pass update: defined container', async () => {
    const containerRequest = await itemContainerService.findAll({
      relations: ['parentContainer'],
    });
    if (!containerRequest) {
      throw new Error();
    }

    const toUpdate = containerRequest.items[0].parentMenuItem;

    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const containedItemA = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItemA) {
      throw new Error();
    }

    const containedItemB = await itemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!containedItemB) {
      throw new Error();
    }

    const containerDtos = [
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: size.id,
          containedMenuItemId: containedItemA.id,
          containedMenuItemSizeId: containedItemA.sizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'update',
        id: containerRequest.items[0].id,
        updateDto: {
          parentContainerMenuItemId: toUpdate.id,
          containedMenuItemId: containedItemB.id,
          containedMenuItemSizeId: containedItemB.sizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      categoryId: category.id,
      name: 'UPDATE NAME',
      sizeIds: [size.id],
      isParbake: true,
      definedContainerItemDtos: containerDtos,
    } as UpdateMenuItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should pass update: container options', async () => {
    const toUpdate = await itemService.findOneByName(item_a);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const optionDto = plainToInstance(NestedMenuItemContainerOptionsDto, {
      mode: 'create',
      createDto: {
        containerRuleDtos: [],
        validQuantity: 1,
      },
    });

    const dto = {
      categoryId: category.id,
      name: 'UPDATE ITEM',
      sizeIds: [size.id],
      isParbake: true,
      containerOptionDto: optionDto,
    } as UpdateMenuItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update (name already exists)', async () => {
    const toUpdate = await itemService.findOneByName(item_a);
    if (!toUpdate) {
      throw new Error();
    }

    const category = await categoryService.findOneByName(CAT_BLUE);
    if (!category) {
      throw new Error();
    }

    const size = await sizeService.findOneByName(SIZE_THREE);
    if (!size) {
      throw new Error();
    }

    const dto = {
      categoryId: category.id,
      name: item_b,
      sizeIds: [size.id],
      isParbake: true,
    } as UpdateMenuItemDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.children[0].field).toEqual('itemName');
  });

  // how should this be handled?
  /*it('should fail update: container options with current defined container', async () => {
    const containerItemRequest = await definedContainerService.findAll({
      relations: ['parentContainer'],
    });
    if (!containerItemRequest) {
      throw new Error();
    }

    const toUpdate = containerItemRequest.items[0].parentContainer;

    const optionDto = plainToInstance(NestedMenuItemContainerOptionsDto, {
      mode: 'create',
      createDto: {
        containerRuleDtos: [],
        validQuantity: 1,
      },
    });

    const dto = {
      containerOptionDto: optionDto,
    } as UpdateMenuItemDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });

  it('should fail update: defined container with current container options', async () => {
    const optionsRequest = await containerOptionsService.findAll({
      relations: ['parentContainer'],
    });
    if (!optionsRequest) {
      throw new Error();
    }

    const toUpdate = optionsRequest.items[0].parentContainer;

    const parentMenuitem = await itemService.findOne(toUpdate.id, [
      'validSizes',
    ]);
    if (!parentMenuitem) {
      throw new Error();
    }

    const containedItemA = await itemService.findOneByName(item_a, [
      'validSizes',
    ]);
    if (!containedItemA) {
      throw new Error();
    }

    const containedItemB = await itemService.findOneByName(item_b, [
      'validSizes',
    ]);
    if (!containedItemB) {
      throw new Error();
    }

    const containerDtos = [
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: parentMenuitem.validSizes[0].id,
          containedMenuItemId: containedItemA.id,
          containedMenuItemSizeId: containedItemA.validSizes[0].id,
          quantity: 1,
        },
      }),
      plainToInstance(NestedMenuItemContainerItemDto, {
        mode: 'create',
        createDto: {
          parentContainerSizeId: parentMenuitem.validSizes[0].id,
          containedMenuItemId: containedItemB.id,
          containedMenuItemSizeId: containedItemB.validSizes[0].id,
          quantity: 1,
        },
      }),
    ];

    const dto = {
      definedContainerItemDtos: containerDtos,
    } as UpdateMenuItemDto;

    try {
      await validator.validateUpdate(toUpdate.id, dto);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationException);
      const error = err as ValidationException;
      expect(error.errors.length).toEqual(1);
      expect(error.errors[0].errorType).toEqual(INVALID);
    }
  });*/
  /*
  it('should fail update: nested containerItem validator', async () => {
    throw new NotImplementedException();
  });

  it('should fail update: nested containerOptions validator', async () => {
    throw new NotImplementedException();
  });*/
});
