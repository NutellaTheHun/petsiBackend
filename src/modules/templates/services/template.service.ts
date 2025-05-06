import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { TemplateBuilder } from '../builders/template.builder';
import { Template } from '../entities/template.entity';
import { TemplateValidator } from '../validators/template.validator';

@Injectable()
export class TemplateService extends ServiceBase<Template>{
    constructor(
      @InjectRepository(Template)
      private readonly templateRepo: Repository<Template>,

      templateBuilder: TemplateBuilder,
      validator: TemplateValidator
    ){ super(templateRepo, templateBuilder, validator, 'TemplateService'); }

    async findOneByName(name: string, relations?: Array<keyof Template>): Promise<Template | null> {
        return await this.templateRepo.findOne({ where: { name: name }, relations: relations });
    }
}