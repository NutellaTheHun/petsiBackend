import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/create-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/update-menu-item-component-options.dto";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { MenuItemComponentOptionsService } from "../services/menu-item-component-options.service";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItemComponentOptionsController } from "./menu-item-component-options.controller";

describe('menu item component options controller', () => {
  let controller: MenuItemComponentOptionsController;
  let service: MenuItemComponentOptionsService;
  let options: MenuItemComponentOptions[];

  beforeAll(async () => {
    const module: TestingModule = await getMenuItemTestingModule();

    controller = module.get<MenuItemComponentOptionsController>(MenuItemComponentOptionsController);
    service = module.get<MenuItemComponentOptionsService>(MenuItemComponentOptionsService);

    const quanties = [1,2,3,4,5];
    let id = 1;
    options = quanties.map( quantity => ({
      id: id++,
      // container: menuItem,
      // isDynamic,
      // validComponents:
      validQuantity: quantity,
    }) as MenuItemComponentOptions);

    jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemComponentOptionsDto) => {
        throw new BadRequestException();
    });

    jest.spyOn(service, 'findAll').mockResolvedValue({ items: options });

    jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
      return options.filter(size => ids.findIndex(id => id === size.id) !== -1);
    });

    jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
      const result = options.find(size => size.id === id);
      if(!result){
        throw new NotFoundException();
      }
      return result;
    });

    jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
      const index = options.findIndex(size => size.id === id);
      if(index === -1){ return false; }

      options.splice(index, 1);
      return true;
    });

    jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemComponentOptionsDto) => {
      const existIdx = options.findIndex(size => size.id === id);
      if(existIdx === -1){ throw new NotFoundException(); }

      if(dto.isDynamic){
        options[existIdx].isDynamic = dto.isDynamic;
      }

      return options[existIdx];
    });    
  });

  it('should be defined', () => {
      expect(service).toBeDefined();
  });

  it('should fail to create menu item component options', async () => {
     const dto = {
     } as CreateMenuItemComponentOptionsDto;
 
     await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
   });
 
   it('should find size by id', async () => {
     const result = await controller.findOne(1);
     expect(result).not.toBeNull();
   });
 
   it('should fail find size by id (not exist)', async () => {
     await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
   });
 
   it('should update size name', async () => {
     const dto = {
       isDynamic: true,
     } as UpdateMenuItemComponentOptionsDto;
 
     const result = await controller.update(1, dto);
 
     expect(result).not.toBeNull();
     expect(result?.id).not.toBeNull()
     expect(result?.isDynamic).toEqual(true);
   });
 
   it('should fail update size name (not exist)', async () => {
     const dto = {
       name: "updateTestItemSize",
     } as UpdateMenuItemComponentOptionsDto;
 
     await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
   });
 
   it('should remove size', async () => {
     const result = await controller.remove(1);
     expect(result).toBeUndefined();
   });
 
   it('should fail remove size (not exist)', async () => {
     await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
   });
});