import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { getRecipeTestingModule } from "../../recipes/utils/recipes-testing.module";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { getTestSizeNames } from "../utils/constants";
import { MenuItemSizeController } from "./menu-item-size.controller";

describe('menu item size controller', () => {
    let controller: MenuItemSizeController;
    let service: MenuItemSizeService;
    let sizes: MenuItemSize[];

    let testId: number;

    beforeAll(async () => {
        const module: TestingModule = await getRecipeTestingModule();

        controller = module.get<MenuItemSizeController>(MenuItemSizeController);
        service = module.get<MenuItemSizeService>(MenuItemSizeService);

        const names = getTestSizeNames();
        let id = 1;
        sizes = names.map(name => ({
            id: id++,
            name: name,
        }) as MenuItemSize);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateMenuItemSizeDto) => {
            const exists = sizes.find(size => size.name === dto.sizeName);
            if (exists) { throw new BadRequestException(); }

            const size = {
                id: id++,
                name: dto.sizeName,
            } as MenuItemSize;

            sizes.push(size);
            return size;
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: sizes });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return sizes.filter(size => ids.findIndex(id => id === size.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id?: number) => {
            const result = sizes.find(size => size.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(service, 'findOneByName').mockImplementation(async (name: string) => {
            return sizes.find(size => size.name === name) || null;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = sizes.findIndex(size => size.id === id);
            if (index === -1) { return false; }

            sizes.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateMenuItemSizeDto) => {
            const existIdx = sizes.findIndex(size => size.id === id);
            if (existIdx === -1) { throw new NotFoundException(); }

            if (dto.sizeName) {
                sizes[existIdx].name = dto.sizeName;
            }

            return sizes[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a size', async () => {
        const dto = {
            sizeName: "testItemSize",
        } as CreateMenuItemSizeDto;

        const result = await controller.create(dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("testItemSize");

        testId = result?.id as number;
    });

    it('should fail to create a size (already exists)', async () => {
        const dto = {
            sizeName: "testItemSize",
        } as CreateMenuItemSizeDto;

        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find size by id', async () => {
        const result = await controller.findOne(testId);
        expect(result).not.toBeNull();
    });

    it('should fail find size by id (not exist)', async () => {
        await expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should update size name', async () => {
        const dto = {
            sizeName: "updateTestItemSize",
        } as UpdateMenuItemSizeDto;

        const result = await controller.update(testId, dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.name).toEqual("updateTestItemSize");
    });

    it('should fail update size name (not exist)', async () => {
        const dto = {
            sizeName: "updateTestItemSize",
        } as UpdateMenuItemSizeDto;

        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });

    it('should remove size', async () => {
        const result = await controller.remove(testId);
        expect(result).toBeUndefined();
    });

    it('should fail remove size (not exist)', async () => {
        await expect(controller.remove(testId)).rejects.toThrow(NotFoundException);
    });
});