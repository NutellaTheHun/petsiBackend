import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateLabelTypeDto } from "../dto/label-type/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/label-type/update-label-type.dto";
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
        if(dto.labelTypeName){
            this.name(dto.labelTypeName);
        }
        if(dto.labelTypeLength){
            this.labelLength(dto.labelTypeLength);
        }
        if(dto.labelTypeWidth){
            this.labelWidth(dto.labelTypeWidth);
        }
    }

    protected updateEntity(dto: UpdateLabelTypeDto): void {
        if(dto.labelTypeName){
            this.name(dto.labelTypeName);
        }
        if(dto.labelTypeLength){
            this.labelLength(dto.labelTypeLength);
        }
        if(dto.labelTypeWidth){
            this.labelWidth(dto.labelTypeWidth);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('labelTypeName', name);
    }

    public labelWidth(val: number): this {
        return this.setPropByVal('labelTypeWidth', val);
    }

    public labelLength(val: number): this {
        return this.setPropByVal('labelTypeLength', val);
    }
}