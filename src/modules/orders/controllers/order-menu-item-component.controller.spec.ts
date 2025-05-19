import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { CreateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/create-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/update-order-menu-item-component.dto";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";
import { OrderMenuItemComponentService } from "../services/order-menu-item-component.service";
import { getOrdersTestingModule } from "../utils/order-testing.module";
import { OrderMenuItemComponentController } from "./order-menu-item-component.controller";

describe('order menu item component controller', () => {
    let controller: OrderMenuItemComponentController;
    let service: OrderMenuItemComponentService;
    let components: OrderMenuItemComponent[];

    beforeAll(async () => {
        const module: TestingModule = await getOrdersTestingModule();
        
        controller = module.get<OrderMenuItemComponentController>(OrderMenuItemComponentController);
        service = module.get<OrderMenuItemComponentService>(OrderMenuItemComponentService);

        const quantities = [1,2,3,4,5];
        let id = 1;
        components = quantities.map(quantity => ({
            id: id++,
            quantity: quantity,
        }) as OrderMenuItemComponent);

        jest.spyOn(service, 'create').mockImplementation(async (dto: CreateOrderMenuItemComponentDto) => {
            throw new BadRequestException();
        });

        jest.spyOn(service, 'findAll').mockResolvedValue({ items: components });

        jest.spyOn(service, 'findEntitiesById').mockImplementation(async (ids: number[]) => {
            return components.filter(type => ids.findIndex(id => id === type.id) !== -1);
        });

        jest.spyOn(service, 'findOne').mockImplementation(async (id: number) => {
            const result = components.find(type => type.id === id);
            if(!result){
                throw new NotFoundException();
            }
            return result;
        });

        jest.spyOn(service, 'remove').mockImplementation(async (id: number) => {
            const index = components.findIndex(type => type.id === id);
            if(index === -1){ return false; }

            components.splice(index, 1);
            return true;
        });

        jest.spyOn(service, 'update').mockImplementation(async (id: number, dto: UpdateOrderMenuItemComponentDto) => {
            const existIdx = components.findIndex(type => type.id === id);
            if(existIdx === -1){ throw new NotFoundException(); }

            if(dto.quantity){
                components[existIdx].quantity = dto.quantity;
            }

            return components[existIdx];
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fail to create a order item component', async () => {
        const dto = {
        } as CreateOrderMenuItemComponentDto;
    
        await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
      
    it('should find order item component by id', async () => {
        const result = await controller.findOne(1);
        expect(result).not.toBeNull();
    });
    
    it('should fail to find order item component by id (not exist)', async () => {
        expect(controller.findOne(0)).rejects.toThrow(NotFoundException);
    });
    
    it('should update quantity', async () => {
        const dto = {
            quantity: 5,
        } as UpdateOrderMenuItemComponentDto;
    
        const result = await controller.update(1, dto);
    
        expect(result).not.toBeNull();
        expect(result?.id).not.toBeNull()
        expect(result?.quantity).toEqual(5);
    });
    
    it('should fail to update order item component (not exist)', async () => {
        const dto = {

        } as UpdateOrderMenuItemComponentDto;
    
        await expect(controller.update(0, dto)).rejects.toThrow(NotFoundException);
    });
    
    it('should remove order item component', async () => {
        const result = await controller.remove(1);
        expect(result).toBeUndefined();
    });
    
    it('should fail to remove order item component (not exist)', async () => {
        await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
    });
});