import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: UpdateOrderMenuItemDto): Promise<string | null> {
        if(dto.menuItemId && !dto.menuItemSizeId){
            return 'menu item update must be accompanie by a menuItemSize';
        }
        return null;
    }
}