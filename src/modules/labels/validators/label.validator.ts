import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Label } from "../entities/label.entity";
import { CreateLabelDto } from "../dto/label/create-label.dto";
import { UpdateLabelDto } from "../dto/label/update-label.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";

@Injectable()
export class LabelValidator extends ValidatorBase<Label> {
    constructor(
        @InjectRepository(Label)
        private readonly repo: Repository<Label>,
    ) { super(repo); }

    public async validateCreate(dto: CreateLabelDto): Promise<void> {
        const exists = await this.repo.findOne({
            where: {
                menuItem: { id: dto.menuItemId },
                labelType: { id: dto.labelTypeId }
            }
        });
        if (exists) {
            this.addError({
                error: 'Label already exists.',
                status: 'EXIST',
                contextEntity: 'CreateLabelDto',
                sourceEntity: 'Label',
                value: { menuItemId: dto.menuItemId, labelTypeId: dto.labelTypeId },
            } as ValidationError);
        }

        this.throwIfErrors();
    }

    public async validateUpdate(id: number, dto: UpdateLabelDto): Promise<void> {
        if (dto.labelTypeId || dto.menuItemId) {

            const currentLabel = await this.repo.findOne({ where: { id }, relations: ['menuItem', 'labelType'] });
            if (!currentLabel) { throw new Error(); }

            const itemId = dto.menuItemId ?? currentLabel?.menuItem.id;
            const labelId = dto.labelTypeId ?? currentLabel?.labelType.id;

            const exists = await this.repo.findOne({
                where: {
                    menuItem: { id: itemId },
                    labelType: { id: labelId }
                }
            });
            if (exists) {
                this.addError({
                    error: 'Label already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateLabelDto',
                    contextId: id,
                    sourceEntity: 'Label',
                    value: { menuItemId: dto.menuItemId, labelTypeId: dto.labelTypeId },
                } as ValidationError);
            }
        }

        this.throwIfErrors();
    }
}