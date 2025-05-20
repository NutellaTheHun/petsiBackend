import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";
import { OrderMenuItemService } from "../services/order-menu-item.service";


@Injectable()
export class OrderValidator extends ValidatorBase<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,
        private readonly itemService: OrderMenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderDto): Promise<string | null> {
        // Validate no duplicate OrderMenuItems
        const hasDuplicateItems = this.helper.hasDuplicatesByComposite(
            dto.orderedMenuItemDtos,
            (item) => `${item.menuItemId}:${item.menuItemSizeId}`
        );
        if(hasDuplicateItems){
            return 'orderedMenuItemDtos contains duplicate menuItem/size combinations';
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderDto): Promise<string | null> {

        // Validate no duplicate OrderMenuItems
        if(dto.orderedMenuItemDtos){

            // resolve update dtos to ensure they contain both menuItemId and menuItemSizeId
            const resolvedDtos: { menuItemId: number; menuItemSizeId: number }[] = [];
            for(const d of dto.orderedMenuItemDtos){
                if(d.mode === 'create'){
                    resolvedDtos.push({ menuItemId: d.menuItemId, menuItemSizeId: d.menuItemSizeId});
                }
                
                else if(d.mode === 'update'){
                    const updateDto = d as UpdateChildOrderMenuItemDto;
                    const currentItem = await this.itemService.findOne(updateDto.id, ['menuItem', 'size']);

                    resolvedDtos.push({
                        menuItemId: updateDto.menuItemId ?? currentItem.menuItem.id,
                        menuItemSizeId: updateDto.menuItemSizeId ?? currentItem.size.id,
                    });
                }
            }
            
            // Check resolved dtos for duplicate
            const duplicateItems = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (item) => `${item.menuItemId}:${item.menuItemSizeId}`
            );
            if(duplicateItems){
                return 'orderedMenuItemDtos contains duplicate menuItem/size combinations';
            }
        }

        return null;
    }
}