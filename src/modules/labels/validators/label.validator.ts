import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
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

  public async validateCreate(
    createId: string,
    dto: CreateLabelDto,
  ): Promise<void> {
    const exists = await this.repo.findOne({
      where: {
        menuItem: { id: dto.menuItemId },
        labelType: { id: dto.labelTypeId },
      },
    });
    if (exists) {
      this.addError(
        this.buildValidationError(
          'labelType',
          'Label type already exists for this item.',
          'EXIST',
          undefined,
          createId,
        ),
      );
    }

    this.throwIfErrors();
  }

  public async validateUpdate(id: number, dto: UpdateLabelDto): Promise<void> {
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
        this.addError(
          this.buildValidationError(
            'labelType',
            'Label type already exists for this item.',
            'EXIST',
            id,
          ),
        );
      }
    }

    this.throwIfErrors();
  }
}
