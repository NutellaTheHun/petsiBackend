import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ServiceBase } from "../../../common/base/service.base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule, RecurringOrderScheduleEntity } from "../entities/recurring-order-schedule.entity";
import { RecurringOrderScheduleComposer } from "../utils/composers/recurring-order-schedule.composer";
import { RecurringOrderScheduleValidator } from "../validators/recurring-order-schedule.validator";

export class RecurringOrderScheduleService extends ServiceBase<RecurringOrderScheduleEntity> {
    constructor(
        @InjectRepository(RecurringOrderSchedule)
        repo: Repository<RecurringOrderSchedule>,

        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: RecurringOrderScheduleValidator,

        private readonly recurringOrderScheduleComposer: RecurringOrderScheduleComposer,
    ) {
        super(
            repo,
            'RecurringOrderScheduleService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(dto: CreateRecurringOrderScheduleDto, manager: EntityManager): Promise<RecurringOrderSchedule> {
        return await manager.save(
            await this.recurringOrderScheduleComposer.composeCreate(dto, manager),
        );
    }
    protected async updateEntity(dto: UpdateRecurringOrderScheduleDto, manager: EntityManager, entity: RecurringOrderSchedule): Promise<void> {
        await this.recurringOrderScheduleComposer.composeUpdate(dto, manager, entity)
        await manager.save(entity);
    }

}