import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemContainerRuleController } from "./menu-item-container-rule.controller";

describe('menu item container rule controller', () => {
  let controller: MenuItemContainerRuleController;
  let service: MenuItemContainerRuleService;
  let compOptions: MenuItemContainerRule[];

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();

    controller = module.get<MenuItemContainerRuleController>(MenuItemContainerRuleController);
    service = module.get<MenuItemContainerRuleService>(MenuItemContainerRuleService);

    const quanties = [1,2,3,4,5];
    let compId = 1;
    compOptions = quanties.map( quantity => ({
      id: compId++,
      //parentOption: ,
      //validItem: ,
      //validSizes: ,
      validQuantity: quantity,
    }) as MenuItemContainerRule);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemContainerRuleDto) => {
        throw new BadRequestException();
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: compOptions });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return compOptions.filter(size => ids.findIndex(id => id === size.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      const result = compOptions.find(size => size.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = compOptions.findIndex(size => size.id === id);
      if(index === -1){ return false; }

      compOptions.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemContainerRuleDto) => {
      const existIdx = compOptions.findIndex(size => size.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.quantity){
        compOptions[existIdx].validQuantity = dto.quantity;
      }

      return compOptions[existIdx];
    });    
  });

  it('should be defined', () => {
      expect(service).toBeDefined();
  });

  it('should not create a component option', async () => {
     const dto = {
       
     } as CreateMenuItemContainerRuleDto;
 
     await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
   });
 
   it('should find size by id', async () => {
     const result = await controller.findOne(1);
     expect(result).not.toBeNull();
   });
 
   it('should fail find size by id (not exist)', async () => {
     await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
   });
 
   it('should update valid quantity', async () => {
     const dto = {
       quantity: 8,
     } as UpdateMenuItemContainerRuleDto;
 
     const result = await controller.update(1, dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.validQuantity).toEqual(8);
   });
 
   it('should fail update size name (not exist)', async () => {
     const dto = {

     } as UpdateMenuItemContainerRuleDto;
 
     await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
   });
 
   it('should remove component option', async () => {
     const result = await controller.remove(1);
     expect(result).toBeUndefined();
   });
 
   it('should fail remove size (not exist)', async () => {
     await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
   });
});