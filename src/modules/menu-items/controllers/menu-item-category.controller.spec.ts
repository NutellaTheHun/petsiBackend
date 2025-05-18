import { TestingModule } from "@nestjs/testing";
import { getRecipeTestingModule } from "../../recipes/utils/recipes-testing.module";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemCategoryController } from "./menu-item-category.controller";
import { getTestCategoryNames } from "../utils/constants";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AppHttpException } from "../../../util/exceptions/AppHttpException";

describe('menu item category controller', () => {
  let controller: MenuItemCategoryController;
  let service: MenuItemCategoryService;
  let categories: MenuItemCategory[];

  let testId: number;

  beforeAll(async () => {
    const module: TestingModule = await getRecipeTestingModule();

    controller = module.get<MenuItemCategoryController>(MenuItemCategoryController);
    service = module.get<MenuItemCategoryService>(MenuItemCategoryService);

    const names = getTestCategoryNames()
    let id = 1;
    categories = names.map( name => ({
      id: id++,
      name: name
    }) as MenuItemCategory);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemCategoryDto) => {
        const exists = categories.find(category => category.name === dto.name);
        if(exists){ throw new BadRequestException(); }

        const category = {
          id: id++,
          name: dto.name,
        } as MenuItemCategory;
  
        categories.push(category);
        return category;
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: categories });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return categories.filter(cat => ids.findIndex(id => id === cat.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      if(!id){ throw new BadRequestException(); }
      const result = categories.find(cat => cat.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
      return categories.find(cat => cat.name === name) || null;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = categories.findIndex(cat => cat.id === id);
      if(index === -1){ return false; }

      categories.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemCategoryDto) => {
      const existIdx = categories.findIndex(cat => cat.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.name){
        categories[existIdx].name = dto.name;
      }

      return categories[existIdx];
    });
  });

  it('should be defined', () => {
      expect(service).toBeDefined();
  });

  it('should create a category', async () => {
     const dto = {
       name: "testCategory",
     } as CreateMenuItemCategoryDto;
 
     const result = await controller.create(dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.name).toEqual("testCategory");
 
     testId = result?.id as number;
   });
 
   it('should fail to create a category (already exists)', async () => {
     const dto = {
       name: "testCategory",
     } as CreateMenuItemCategoryDto;
     
     await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
   });
 
   it('should find category by id', async () => {
     const result = await controller.findOne(testId);
     expect(result).not.toBeNull();
   });
 
   it('should fail find category by id (not exist)', async () => {
      await expect(controller.findOne(0)).rejects.toThrow(BadRequestException);
   });
 
   it('should update category name', async () => {
     const dto = {
       name: "updateTestCategory",
     } as UpdateMenuItemCategoryDto;
 
     const result = await controller.update(testId, dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.name).toEqual("updateTestCategory");
   });
 
   it('should fail update category name (not exist)', async () => {
     const dto = {
       name: "updateTestCategory",
     } as UpdateMenuItemCategoryDto;
 
     await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
   });
 
   it('should remove category', async () => {
     const result = await controller.remove(testId);
     expect(result).toBeUndefined();
   });
 
   it('should fail remove category (not exist)', async () => {
     await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
   });
});