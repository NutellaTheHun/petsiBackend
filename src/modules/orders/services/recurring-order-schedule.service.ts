import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ServiceBase } from "../../../common/base/service.base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/create-recurring-order-schedule.dto";
import { RecurringOrderScheduleResponseDto } from "../dto/recurring-order-schedule/recurring-order-schedule-response.dto";
import { UpdateRecurringOrderScheduleDto } from "../dto/recurring-order-schedule/update-recurring-order-schedule.dto";
import { RecurringOrderSchedule, RecurringOrderScheduleEntity } from "../entities/recurring-order-schedule.entity";
import { RecurringOrderScheduleComposer } from "../utils/composers/recurring-order-schedule.composer";
import { recurringOrderScheduleToResponseDto } from "../utils/entity-transformers/recurring-order-schedule.dto.transformer";
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

    /**
     * Method to create a recurring order schedule and return a response DTO. Required function for create endpoint. Service base only creates the entity, this method is responsible for returning the response DTO.
     */
    public async createRecurringOrderScheduleResponse(dto: CreateRecurringOrderScheduleDto, manager: EntityManager): Promise<RecurringOrderScheduleResponseDto> {
        const result = await this.recurringOrderScheduleComposer.composeCreate(dto, manager);
        await manager.save(result);
        return recurringOrderScheduleToResponseDto(result);
    }

    /**
     * Method to update a recurring order schedule and return a response DTO. Required function for update endpoint. Service base only updates the entity, this method is responsible for returning the response DTO.
     */
    public async updateRecurringOrderScheduleResponse(dto: UpdateRecurringOrderScheduleDto, manager: EntityManager, entity: RecurringOrderSchedule): Promise<RecurringOrderScheduleResponseDto> {
        await this.recurringOrderScheduleComposer.composeUpdate(dto, manager, entity);
        await manager.save(entity);
        return recurringOrderScheduleToResponseDto(entity);
    }


    /**  ---------------------------- Unused Service Base Methods, but kept for reference ---------------------------- */

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