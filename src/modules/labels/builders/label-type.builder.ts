import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateLabelTypeDto } from "../dto/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/update-label-type.dto";
import { LabelType } from "../entities/label-type.entity";
import { LabelTypeValidator } from "../validators/label-type.validator";

@Injectable()
export class LabelTypeBuilder extends BuilderBase<LabelType> {
    constructor(
        validator: LabelTypeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(LabelType, 'LabelTypeBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateLabelTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateLabelTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}