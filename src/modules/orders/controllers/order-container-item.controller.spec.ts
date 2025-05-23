import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderContainerItemController } from "./order-container-item.controller";

describe('order container item controller', () => {
    let controller: OrderContainerItemController;
    let service: OrderContainerItemService;
    let components: OrderContainerItem[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();

        controller = module.get<OrderContainerItemController>(OrderContainerItemController);
        service = module.get<OrderContainerItemService>(OrderContainerItemService);

        const quantities = [1, 2, 3, 4, 5];
        let id = 1;
        components = quantities.map(quantity => ({
            id: id++,
            quantity: quantity,
        }) as OrderContainerItem);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderContainerItemDto) => {
            throw new BadRequestException();
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: components });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return components.filter(type => ids.findIndex(id => id === type.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            const result = components.find(type => type.id === id);
            if (!result) {
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = components.findIndex(type => type.id === id);
            if (index === -1) { return false; }

            components.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderContainerItemDto) => {
            const existIdx = components.findIndex(type => type.id === id);
            if (existIdx === -1) { throw new NotFoundException(); }

            if (dto.quantity) {
                components[existIdx].quantity = dto.quantity;
            }

            return components[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fail to create a container item', async () => {
        const dto = {
        } as CreateOrderContainerItemDto;

        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should find container item component by id', async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });

    it('should fail to find container item by id (not exist)', async () => {
        expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should update quantity', async () => {
        const dto = {
            quantity: 5,
        } as UpdateOrderContainerItemDto;

        const result = await controller.update(1, dto);

        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.quantity).toEqual(5);
    });

    it('should fail to update container item (not exist)', async () => {
        const dto = {

        } as UpdateOrderContainerItemDto;

        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });

    it('should remove container item', async () => {
        const result = await controller.remove(1);
        expect(result).toBeUndefined();
    });

    it('should fail to remove container item (not exist)', async () => {
        await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
    });
});