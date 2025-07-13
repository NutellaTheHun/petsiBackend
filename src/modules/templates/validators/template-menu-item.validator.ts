import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';

@Injectable()
export class TemplateMenuItemValidator extends ValidatorBase<TemplateMenuItem> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    private readonly repo: Repository<TemplateMenuItem>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'TemplateMenuItem', requestContextService, logger);
  }

  public async validateCreate(dto: CreateTemplateMenuItemDto): Promise<void> {
    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateTemplateMenuItemDto,
  ): Promise<void> {
    this.throwIfErrors();
  }
}
