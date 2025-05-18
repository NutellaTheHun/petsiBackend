import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ComponentOptionBuilder } from "../builders/component-option.builder";
import { ComponentOption } from "../entities/component-option.entity";
import { ComponentOptionValidator } from "../validators/component-option.validator";
import { CreateComponentOptionDto } from "../dto/child-component-option/create-component-option.dto";

@Injectable()
export class ComponentOptionService extends ServiceBase<ComponentOption> {
    constructor(
        @InjectRepository(ComponentOption)
        private readonly repo: Repository<ComponentOption>,

        @Inject(forwardRef(() => ComponentOptionBuilder))
        optionBuilder: ComponentOptionBuilder,

        validator: ComponentOptionValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(repo, optionBuilder, validator, 'ComponentOptionService', requestContextService, logger); }

    public async create(dto: CreateComponentOptionDto): Promise<ComponentOption> {
        throw new BadRequestException();
    }
}