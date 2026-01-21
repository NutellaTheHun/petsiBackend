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

@Injectable()
export class LabelValidator extends ValidatorBase<LabelEntity> {
  constructor(
    @InjectRepository(Label)
    private readonly repo: Repository<Label>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Label', requestContextService, logger);
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
