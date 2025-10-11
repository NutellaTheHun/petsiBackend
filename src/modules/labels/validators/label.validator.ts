import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    const exists = await this.repo.findOne({
      where: {
        menuItem: { id: dto.menuItemId },
        labelType: { id: dto.labelTypeId },
      },
    });
    if (exists) {
      const err = new ValidationErrorNode(
        'labelType',
        id,
        'Label type already exists for this item.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateLabelDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

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
        const err = new ValidationErrorNode(
          'labelType',
          id,
          'Label type already exists for this item.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
