import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { LabelType } from '../entities/label-type.entity';
import { Label } from '../entities/label.entity';

@Injectable()
export class LabelBuilder extends BuilderBase<Label> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,

    @InjectRepository(LabelType)
    private readonly typeRepo: Repository<LabelType>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(Label, 'LabelBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateLabelDto): void {
    if (dto.imageUrl !== undefined) {
      this.imageUrl(dto.imageUrl);
    }
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.labelTypeId !== undefined) {
      this.labelTypeById(dto.labelTypeId);
    }
  }

  protected updateEntity(dto: UpdateLabelDto): void {
    if (dto.imageUrl !== undefined) {
      this.imageUrl(dto.imageUrl);
    }
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.labelTypeId !== undefined) {
      this.labelTypeById(dto.labelTypeId);
    }
  }

  public menuItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.itemRepo.findOne({ where: { id } }),
      'menuItem',
      id,
    );
  }

  public menuItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.itemRepo.findOne({ where: { name } }),
      'menuItem',
      name,
    );
  }

  public imageUrl(url: string): this {
    return this.setPropByVal('imageUrl', url);
  }

  public labelTypeById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.typeRepo.findOne({ where: { id } }),
      'labelType',
      id,
    );
  }

  public labelTypeByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.typeRepo.findOne({ where: { name } }),
      'labelType',
      name,
    );
  }
}
