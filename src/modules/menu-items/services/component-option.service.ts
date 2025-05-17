import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ComponentOptionBuilder } from "../builders/component-option.builder";
import { ComponentOption } from "../entities/component-option.entity";
import { ComponentOptionValidator } from "../validators/component-option.validator";

@Injectable()
export class ComponentOptionService extends ServiceBase<ComponentOption> {
    constructor(
        @InjectRepository(ComponentOption)
        private readonly optionReop: Repository<ComponentOption>,

        @Inject(forwardRef(() => ComponentOptionBuilder))
        optionBuilder: ComponentOptionBuilder,

        validator: ComponentOptionValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(optionReop, optionBuilder, validator, 'ComponentOptionService', requestContextService, logger); }
}