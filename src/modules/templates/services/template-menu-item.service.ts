import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { TemplateMenuItemBuilder } from '../builders/template-menu-item.builder';
import { CreateTemplateMenuItemDto } from '../dto/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateService } from './template.service';

@Injectable()
export class TemplateMenuItemService extends ServiceBase<TemplateMenuItem> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    private readonly itemRepo: Repository<TemplateMenuItem>,
    private readonly itemBuilder: TemplateMenuItemBuilder,

    private readonly templateService: TemplateService,
  ){ super(itemRepo); }

  async create(dto: CreateTemplateMenuItemDto): Promise<TemplateMenuItem | null> {
    const parentTemplate = await this.templateService.findOne(dto.templateId);
    if(!parentTemplate){ throw new NotFoundException(); }

    const item = await this.itemBuilder.buildCreateDto(parentTemplate, dto);
    return await this.itemRepo.save(item);
  }
      
  /**
  * Uses Repository.Save(), not Repository.Update
  */
  async update(id: number, dto: UpdateTemplateMenuItemDto): Promise<TemplateMenuItem | null> {
    const toUpdate = await this.findOne(id);
    if(!toUpdate){ return null; }

    await this.itemBuilder.buildUpdateDto(toUpdate, dto);
    return await this.itemRepo.save(toUpdate);
  }
}
