import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderContainerItemBuilder } from "../builders/order-container-item.builder";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderContainerItemValidator } from "../validators/order-container-item.validator";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";

@Injectable()
export class OrderContainerItemService extends ServiceBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        repo: Repository<OrderContainerItem>,

        @Inject(forwardRef(() => OrderContainerItemBuilder))
        typeBuilder: OrderContainerItemBuilder,
        
        validator: OrderContainerItemValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(repo, typeBuilder, validator, 'OrderMenuItemComponentService', requestContextService, logger)}

    public async create(dto: CreateOrderContainerItemDto): Promise<OrderContainerItem> {
        throw new BadRequestException();
    }
}