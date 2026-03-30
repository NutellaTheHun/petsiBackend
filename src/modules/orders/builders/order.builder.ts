import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderMenuItemDto } from '../dto/order-menu-item/create-order-menu-item.dto';
import { NestedCreateOrderMenuItemDto } from '../dto/order-menu-item/nested-create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from '../dto/order-menu-item/nested-update-order-menu-item.dto';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { NestedCreateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-create-recurring-order-schedule.dto';
import { NestedUpdateRecurringOrderScheduleDto } from '../dto/recurring-order-schedule/nested-update-recurring-order-schedule.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { OccurrenceState, OccurrenceType } from '../utils/occurence-types';
import { OrderMenuItemBuilder } from './order-menu-item.builder';
import { RecurringOrderScheduleBuilder } from './recurring-order-schedule.builder';

@Injectable()
export class OrderBuilder extends BuilderBase<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(OrderCategory)
        private readonly categoryRepo: Repository<OrderCategory>,

        @InjectRepository(OrderMenuItem)
        private readonly orderItemRepo: Repository<OrderMenuItem>,

        @Inject(forwardRef(() => OrderMenuItemBuilder))
        private readonly itemBuilder: OrderMenuItemBuilder,

        @Inject(forwardRef(() => RecurringOrderScheduleBuilder))
        private readonly recurrenceScheduleBuilder: RecurringOrderScheduleBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(Order, 'OrderBuilder', requestContextService, logger);
    }

    protected createEntity(dto: CreateOrderDto): void {
        if (dto.deliveryAddress !== undefined) {
            this.deliveryAddress(dto.deliveryAddress);
        }
        if (dto.email !== undefined) {
            this.email(dto.email);
        }
        if (dto.fulfillmentDate !== undefined) {
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if (dto.fulfillmentType !== undefined) {
            this.fulfillmentType(dto.fulfillmentType);
        }
        if (dto.isFrozen !== undefined) {
            this.isFrozen(dto.isFrozen);
        }
        if (dto.note !== undefined) {
            this.note(dto.note);
        }
        if (dto.orderedItems !== undefined) {
            this.orderedItemsByBuilder(dto.orderedItems);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);
        }
        if (dto.phoneNumber !== undefined) {
            this.phoneNumber(dto.phoneNumber);
        }
        if (dto.recipient !== undefined) {
            this.recipient(dto.recipient);
        }
        if (dto.fulfillmentContactName !== undefined) {
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
        if (dto.recurrenceDate !== undefined) {
            this.reccurenceDate(dto.recurrenceDate);
        }
        if (dto.templateOrderId !== undefined) {
            this.templateOrderId(dto.templateOrderId);
        }
        if (dto.occurrenceType !== undefined) {
            this.occurrenceType(dto.occurrenceType as OccurrenceType | null);
        }
        if (dto.occurrenceState !== undefined) {
            this.occurrenceState(dto.occurrenceState as OccurrenceState | null);
        }
        if (dto.recurrenceSchedule !== undefined) {
            this.recurrenceScheduleByBuilder(dto.recurrenceSchedule);
        }
    }

    protected updateEntity(dto: UpdateOrderDto): void {
        if (dto.deliveryAddress !== undefined) {
            this.deliveryAddress(dto.deliveryAddress);
        }
        if (dto.email !== undefined) {
            this.email(dto.email);
        }
        if (dto.fulfillmentDate !== undefined) {
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if (dto.fulfillmentType !== undefined) {
            this.fulfillmentType(dto.fulfillmentType);
        }
        if (dto.isFrozen !== undefined) {
            this.isFrozen(dto.isFrozen);
        }
        if (dto.note !== undefined) {
            this.note(dto.note);
        }
        if (dto.orderedItems !== undefined) {
            this.orderedItemsByBuilder(dto.orderedItems);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);
        }
        if (dto.phoneNumber !== undefined) {
            this.phoneNumber(dto.phoneNumber);
        }
        if (dto.recipient !== undefined) {
            this.recipient(dto.recipient);
        }
        if (dto.fulfillmentContactName !== undefined) {
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
        if (dto.occurrenceType !== undefined) {
            this.occurrenceType(dto.occurrenceType as OccurrenceType | null);
        }
        if (dto.occurrenceState !== undefined) {
            this.occurrenceState(dto.occurrenceState as OccurrenceState | null);
        }
        if (dto.recurrenceSchedule !== undefined) {
            this.recurrenceScheduleByBuilder(dto.recurrenceSchedule);
        }
    }

    public categoryById(id: number): this {
        return this.setPropById(
            async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
            'category',
            id,
        );
    }

    public categoryByName(name: string): this {
        return this.setPropByName(
            async (name: string) =>
                await this.categoryRepo.findOne({ where: { name } }),
            'category',
            name,
        );
    }

    public recipient(name: string): this {
        return this.setPropByVal('recipient', name);
    }

    public fulfillmentDate(date: Date): this {
        return this.setPropByVal('fulfillmentDate', date);
    }

    public fulfillmentType(type: string): this {
        return this.setPropByVal('fulfillmentType', type);
    }

    public deliveryAddress(address: string | null): this {
        if (address === null) {
            return this.setPropByVal('deliveryAddress', null);
        }
        return this.setPropByVal('deliveryAddress', address);
    }

    public phoneNumber(number: string | null): this {
        if (number === null) {
            return this.setPropByVal('phoneNumber', null);
        }
        return this.setPropByVal('phoneNumber', number);
    }

    public email(email: string | null): this {
        if (email === null) {
            return this.setPropByVal('email', null);
        }
        return this.setPropByVal('email', email);
    }

    public note(note: string | null): this {
        if (note === null) {
            return this.setPropByVal('note', null);
        }
        return this.setPropByVal('note', note);
    }

    public isFrozen(val: boolean): this {
        return this.setPropByVal('isFrozen', val);
    }

    public orderedItemsById(ids: number[]): this {
        return this.setPropsByIds(
            async (ids: number[]) =>
                await this.orderItemRepo.find({ where: { id: In(ids) } }),
            'orderedItems',
            ids,
        );
    }

    public orderedItemsByBuilder(
        dtos: (
            | CreateOrderMenuItemDto
            | NestedCreateOrderMenuItemDto
            | NestedUpdateOrderMenuItemDto
        )[],
    ): this {
        return this.setPropByBuilder(
            this.itemBuilder.buildMany.bind(this.itemBuilder),
            'orderedItems',
            this.entity,
            dtos,
        );
    }

    public recurrenceScheduleByBuilder(dto: NestedCreateRecurringOrderScheduleDto | NestedUpdateRecurringOrderScheduleDto | null): this {
        if (dto === null) {
            return this.setPropByVal('recurrenceSchedule', null);
        }
        return this.setPropByBuilder(
            this.recurrenceScheduleBuilder.build.bind(this.recurrenceScheduleBuilder),
            'recurrenceSchedule',
            this.entity,
            dto,
        );
    }

    public fulfillmentContactName(name: string | null): this {
        if (name === null) {
            return this.setPropByVal('fulfillmentContactName', null);
        }
        return this.setPropByVal('fulfillmentContactName', name);
    }

    public reccurenceDate(date: Date | null): this {
        if (date === null) {
            return this.setPropByVal('recurrenceDate', null);
        }
        return this.setPropByVal('recurrenceDate', date);
    }

    public templateOrderId(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('templateOrderId', null);
        }
        return this.setPropByVal('templateOrderId', id);
    }

    public occurrenceType(type: OccurrenceType | null): this {
        if (type === null) {
            return this.setPropByVal('occurrenceType', null);
        }
        return this.setPropByVal('occurrenceType', type);
    }

    public occurrenceState(state: OccurrenceState | null): this {
        if (state === null) {
            return this.setPropByVal('occurrenceState', null);
        }
        return this.setPropByVal('occurrenceState', state);
    }

    public recurrenceSchedule(schedule: RecurringOrderSchedule): this {
        return this.setPropByVal('recurrenceSchedule', schedule);
    }
}
