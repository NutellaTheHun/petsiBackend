import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { DatabaseTestContext } from '../../../test/DatabaseTestContext';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { REC_SUBCAT_1, REC_SUBCAT_2, REC_SUBCAT_3 } from '../utils/constants';
import { RecipeTestUtil } from '../utils/recipe-test.util';
import { getRecipeTestingModule } from '../utils/recipes-testing.module';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';

describe('recipe sub category validator', () => {
  let testingUtil: RecipeTestUtil;
  let dbTestContext: DatabaseTestContext;

  let validator: RecipeSubCategoryValidator;
  let subCategoryRepo: Repository<RecipeSubCategory>;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();
    dbTestContext = new DatabaseTestContext();
    testingUtil = module.get<RecipeTestUtil>(RecipeTestUtil);
    await testingUtil.initRecipeSubCategoryTestingDatabase(dbTestContext);

    validator = module.get<RecipeSubCategoryValidator>(
      RecipeSubCategoryValidator,
    );

    subCategoryRepo = module.get(getRepositoryToken(RecipeSubCategory));
  });

  afterAll(async () => {
    await dbTestContext.executeCleanupFunctions();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined;
  });

  it('should validate create', async () => {
    const dto = {
      name: 'CREATE',
    } as CreateRecipeSubCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeNull();
  });

  it('should fail create: name already exists', async () => {
    const dto = {
      name: REC_SUBCAT_3,
    } as CreateRecipeSubCategoryDto;

    const result = await validator.validateCreateNode('root', dto);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategoryName');
  });

  it('should pass update', async () => {
    const toUpdate = await service.findOneByName(REC_SUBCAT_1);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: 'UPDATE',
    } as UpdateRecipeSubCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeNull();
  });

  it('should fail update: name already exists', async () => {
    const toUpdate = await service.findOneByName(REC_SUBCAT_1);
    if (!toUpdate) {
      throw new Error();
    }

    const dto = {
      name: REC_SUBCAT_2,
    } as UpdateRecipeSubCategoryDto;

    const result = await validator.validateUpdateNode('root', dto, toUpdate.id);
    expect(result).toBeInstanceOf(ValidationErrorNode);
    expect(result?.children.length).toEqual(1);
    expect(result?.children[0].message).not.toBeNull();
    expect(result?.field).toEqual('subCategoryName');
  });
});
