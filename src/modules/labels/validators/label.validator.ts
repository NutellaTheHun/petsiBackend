import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label, LabelEntity } from '../entities/label.entity';
import { LabelValidatorIdentity } from './identities/label.validator.identity.interface';

@Injectable()
export class LabelValidator extends ValidatorBase<LabelEntity, LabelValidatorIdentity> {

    constructor(
        @InjectRepository(Label)
        private readonly repo: Repository<Label>,

        @InjectRepository(LabelType)
        private readonly labelTypeRepo: Repository<LabelType>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

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
                this.labelTypeRepo,
                'labelType',
                errorMap,
            );
        }

        if (identity.menuItemId !== undefined) {
            this.helper.enforceExists(
                identity.menuItemId,
                this.menuItemRepo,
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
            if (exists && exists.id !== id) {
                errorMap.addError('ALREADY_EXISTS', undefined, ['labelType']);
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
