import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { Label, LabelEntity } from '../entities/label.entity';
import { LabelValidatorIdentity } from './identities/label.validator.identity.interface';

@Injectable()
export class LabelValidator extends ValidatorBase<LabelEntity, LabelValidatorIdentity> {

    constructor(
        @InjectRepository(Label)
        private readonly repo: Repository<Label>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Label', requestContextService, logger);
    }

    protected async validateIdentity(identity: LabelValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.labelTypeId) {
            this.helper.enforceExists(
                identity.labelTypeId,
                this.repo,
                'labelType',
                errorMap,
            );
        }

        if (identity.menuItemId) {
            this.helper.enforceExists(
                identity.menuItemId,
                this.repo,
                'menuItem',
                errorMap,
            );
        }

        if (identity.menuItemId || identity.labelTypeId) {
            const exists = await this.repo.findOne({
                where: {
                    menuItem: { id: identity.menuItemId },
                    labelType: { id: identity.labelTypeId },
                },
            });
            if (exists) {
                errorMap.addError('ALREADY_EXISTS', undefined, ['labelType', 'menuItem']);
            }
        }

        return errorMap;
    }
    public async resolveIdentity(dto: CreateLabelDto | UpdateLabelDto, id: number | string): Promise<LabelValidatorIdentity> {

        if (dto instanceof CreateLabelDto) {
            return {
                imageUrl: dto.imageUrl,
                labelTypeId: dto.labelTypeId,
                menuItemId: dto.menuItemId,
            } as LabelValidatorIdentity;
        }

        const entity = await this.repo.findOne({
            where: { id: id as number },
            relations: ['menuItem', 'labelType'],
        });
        if (!entity) {
            throw new NotFoundException();
        }

        let labelTypeId: number | null = null;
        let menuItemId: number | null = null;

        if (dto.labelTypeId || dto.menuItemId) {
            labelTypeId = dto.labelTypeId ?? entity.labelType.id;
            menuItemId = dto.menuItemId ?? entity.menuItem.id;
        }

        return {
            id: entity.id,
            imageUrl: entity.imageUrl,
            labelTypeId: labelTypeId ?? undefined,
            menuItemId: menuItemId ?? undefined,
        } as LabelValidatorIdentity;
    }

    protected async doValidateCreateNode(
        dto: CreateLabelDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        const exists = await this.repo.findOne({
            where: {
                menuItem: { id: dto.menuItemId },
                labelType: { id: dto.labelTypeId },
            },
        });
        if (exists) {
            errorMap.addChild(
                'labelType',
                new ValidationErrorMap(
                    undefined,
                    'Label type already exists for this item.',
                ),
            );
        }

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateLabelDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (dto.labelTypeId || dto.menuItemId) {
            const currentLabel = await this.repo.findOne({
                where: { id },
                relations: ['menuItem', 'labelType'],
            });
            if (!currentLabel) {
                throw new Error();
            }

            const itemId = dto.menuItemId ?? currentLabel?.menuItem.id;
            const labelId = dto.labelTypeId ?? currentLabel?.labelType.id;

            const exists = await this.repo.findOne({
                where: {
                    menuItem: { id: itemId },
                    labelType: { id: labelId },
                },
            });
            if (exists) {
                errorMap.addChild(
                    'labelType',
                    new ValidationErrorMap(
                        undefined,
                        'Label type already exists for this item.',
                    ),
                );
            }
        }

        return errorMap;
    }
}
