import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeValidator } from "../validators/order-type.validator";

@Injectable()
export class OrderTypeBuilder extends BuilderBase<OrderType>{
    constructor(
        validator: OrderTypeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(OrderType, 'OrderTypeBuilder',  requestContextService, logger, validator); }

    protected createEntity(dto: CreateOrderTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateOrderTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}