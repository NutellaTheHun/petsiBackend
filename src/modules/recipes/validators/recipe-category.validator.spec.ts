import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { REC_CAT_A, REC_CAT_B } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeCategoryValidator } from './recipe-category.validator';

describe('recipe category validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeCategoryValidator;
  let categoryRepo: Repository<RecipeCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    validator = module.get<RecipeCategoryValidator>(RecipeCategoryValidator);

    categoryRepo = module.get(getRepositoryToken(RecipeCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];
    const dto = {
      name: REC_CAT_A,
      subCategories: subCatDtos,
    } as CreateRecipeCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: name already exists', async () => {
    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];
    const dto = {
      name: REC_CAT_A,
      subCategories: subCatDtos,
    } as CreateRecipeCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });

  it('should fail create: subcategory validator: already exists', async () => {
    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];
    const dto = {
      name: 'testCatValidFail',
      subCategories: subCatDtos,
    } as CreateRecipeCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategories');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
    if (!toUpdate) {
      throw new Error();
    }

    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'update',
        id: toUpdate.subCategories[0].id,
        updateDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];

    const dto = {
      name: 'UPDATE',
      subCategories: subCatDtos,
    } as UpdateRecipeCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: name already exists', async () => {
    const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
    if (!toUpdate) {
      throw new Error();
    }

    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'update',
        id: toUpdate.subCategories[0].id,
        updateDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];

    const dto = {
      name: REC_CAT_B,
      subCategories: subCatDtos,
    } as UpdateRecipeCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('categoryName');
  });

  it('should fail update: subcategory validator: already exists', async () => {
    const toUpdate = await service.findOneByName(REC_CAT_A, ['subCategories']);
    if (!toUpdate) {
      throw new Error();
    }

    const subCatDtos = [
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'create',
        createDto: {
          subCategoryName: 'SUB CAT 1',
        },
      }),
      plainToInstance(NestedRecipeSubCategoryDto, {
        mode: 'update',
        id: toUpdate.subCategories[0].id,
        updateDto: {
          subCategoryName: 'SUB CAT 2',
        },
      }),
    ];

    const dto = {
      name: REC_CAT_B,
      subCategories: subCatDtos,
    } as UpdateRecipeCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategories');
  });
});
