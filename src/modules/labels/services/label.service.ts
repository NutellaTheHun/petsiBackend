import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { LabelBuilder } from '../builders/label.builder';
import { Label } from '../entities/label.entity';

@Injectable()
export class LabelService extends ServiceBase<Label> {
    constructor(
        @InjectRepository(Label)
        private readonly repo: Repository<Label>,

        builder: LabelBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'LabelService', requestContextService, logger); }

    async findByMenuItemId(itemId: number, relations?: Array<keyof Label>): Promise<Label[]> {
        return await this.repo.find({
            where: {
                menuItem: { id: itemId }
            },
            relations,
        });
    }
}