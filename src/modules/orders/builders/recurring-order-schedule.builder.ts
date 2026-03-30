import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BuilderBase } from "../../../common/base/builder.base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { Order } from "../entities/order.entity";
import { RecurringOrderSchedule } from "../entities/recurring-order-schedule.entity";
import { buildRruleString } from "../utils/rrule.util";

export class RecurringOrderScheduleBuilder extends BuilderBase<RecurringOrderSchedule> {

    constructor(
        @InjectRepository(RecurringOrderSchedule)
        private readonly recurringOrderScheduleRepo: Repository<RecurringOrderSchedule>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(RecurringOrderSchedule, 'RecurringOrderScheduleBuilder', requestContextService, logger);
    }

    protected createEntity(dto: CreateRecurringOrderScheduleDto): void {
        if (dto.orderId !== undefined) {
            this.orderById(dto.orderId);
        }
        if (dto.startDate !== undefined) {
            this.startDate(dto.startDate);
        }
        if (dto.endDate !== undefined) {
            this.endDate(dto.endDate);
        }
        if (dto.timezone !== undefined) {
            this.timezone(dto.timezone);
        }

        // frequency is the only required field for rrule string
        if (dto.frequency !== undefined) {
            this.rruleString(dto);
        }

    }
    protected updateEntity(dto: UpdateRecurringOrderScheduleDto): void {
        if (dto.startDate !== undefined) {
            this.startDate(dto.startDate);
        }
        if (dto.endDate !== undefined) {
            this.endDate(dto.endDate);
        }
        if (dto.timezone !== undefined) {
            this.timezone(dto.timezone);
        }

        // frequency is the only required field for rrule string
        if (dto.frequency !== undefined) {
            this.rruleString(dto);
        }

    }

    public orderById(id: number): this {
        return this.setPropById(async (id: number) => await this.orderRepo.findOne({ where: { id } }), 'order', id);
    }
    public startDate(date: Date): this {
        return this.setPropByVal('startDate', date);
    }
    public endDate(date: Date): this {
        return this.setPropByVal('endDate', date);
    }
    public timezone(timezone: string): this {
        return this.setPropByVal('timezone', timezone);
    }

    public rruleString(
        dto: CreateRecurringOrderScheduleDto | UpdateRecurringOrderScheduleDto,
    ): this {
        const rruleString = buildRruleString(dto);
        return this.setPropByVal('rrule', rruleString);
    }
}