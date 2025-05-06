import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { TemplateBuilder } from '../builders/template.builder';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateValidator } from '../validators/template.validator';

@Injectable()
export class TemplateService extends ServiceBase<Template>{
    constructor(
      @InjectRepository(Template)
      private readonly templateRepo: Repository<Template>,

      private readonly templateBuilder: TemplateBuilder,
      validator: TemplateValidator
    ){ super(templateRepo, templateBuilder, validator, 'TemplateService'); }

    async create(dto: CreateTemplateDto): Promise<Template | null> {
        const exist = await this.findOneByName(dto.name);
        if(exist){ return null; }

        const template = await this.templateBuilder.buildCreateDto(dto);
        return await this.templateRepo.save(template);
    }

    async update(id: number, dto: UpdateTemplateDto): Promise<Template | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.templateBuilder.buildUpdateDto(toUpdate, dto);
        
        return await this.templateRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof Template>): Promise<Template | null> {
        return await this.templateRepo.findOne({ where: { name: name }, relations: relations });
    }
}