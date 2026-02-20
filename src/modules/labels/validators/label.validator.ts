import { Injectable } from '@nestjs/common';
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

    protected async validateIdentity(identity: LabelValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.labelTypeId !== undefined) {
            this.helper.enforceExists(
                identity.labelTypeId,
                this.repo,
                'labelType',
                errorMap,
            );
        }

        if (identity.menuItemId !== undefined) {
            this.helper.enforceExists(
                identity.menuItemId,
                this.repo,
                'menuItem',
                errorMap,
            );
        }

        if (identity.menuItemId && identity.labelTypeId) {
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
        return {
            imageUrl: dto.imageUrl,
            labelTypeId: dto.labelTypeId,
            menuItemId: dto.menuItemId,
        } as LabelValidatorIdentity;
    }

}
