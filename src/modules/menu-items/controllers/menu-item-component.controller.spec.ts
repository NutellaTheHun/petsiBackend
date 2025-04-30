import { TestingModule } from "@nestjs/testing";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { MenuItemComponentController } from "./menu-item-component.controller";
import { getMenuItemTestingModule } from "../utils/menu-item-testing.module";
import { MenuItem } from "../entities/menu-item.entity";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { NotImplementedException } from "@nestjs/common";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";

describe('menu item component controller', () => {
    let controller: MenuItemComponentController;
    let service: MenuItemComponentService;

    let components: MenuItemComponent[] = [];
    let componentId: number = 1;

    let items: MenuItem[] = [];
    let itemId: number = 1;

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getMenuItemTestingModule();

        controller = module.get<MenuItemComponentController>(MenuItemComponentController);
        service = module.get<MenuItemComponentService>(MenuItemComponentService);

        // init menuItems:


        // init components
        // parentMenuItem
        // menuItem
        // menuItemSize
        // quantity

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemComponentDto) => {
            throw new NotImplementedException();
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: components});

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            throw new NotImplementedException();
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            throw new NotImplementedException();
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            throw new NotImplementedException();
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemComponentDto) => {
            throw new NotImplementedException();
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a component', async () => {

    });

    it('should find one component by id', async () => {

    });

    it('should fail to find one component by id (doesnt exist)', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });

    it('should ', async () => {

    });
});