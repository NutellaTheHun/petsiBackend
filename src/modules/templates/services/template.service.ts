import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateBuilder } from '../builders/template.builder';
import { Template } from '../entities/template.entity';

@Injectable()
export class TemplateService extends ServiceBase<Template> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,

        builder: TemplateBuilder,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'TemplateService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof Template>): Promise<Template | null> {
        return await this.repo.findOne({ where: { templateName: name }, relations: relations });
    }
}