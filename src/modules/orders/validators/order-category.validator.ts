import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import {
    OrderCategory,
    OrderCategoryEntity,
} from '../entities/order-category.entity';
import { OrderCategoryValidatorIdentity } from './validation-identities/order-category.validator.identity.interface';

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategoryEntity, OrderCategoryValidatorIdentity> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly repo: Repository<OrderCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'OrderCategory', requestContextService, logger);
    }

    protected async validateIdentity(identity: OrderCategoryValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateOrderCategoryDto | UpdateOrderCategoryDto, id: number | string): Promise<OrderCategoryValidatorIdentity> {
        return {
            name: dto.name,
        } as OrderCategoryValidatorIdentity;
    }

    protected async doValidateCreateNode(
        dto: CreateOrderCategoryDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // name exists
        await this.helper.enforceUnique(
            dto.name,
            this.repo,
            'name',
            errorMap,
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateOrderCategoryDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // name exists
        if (dto.name) {
            await this.helper.enforceUnique(
                dto.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        return errorMap;
    }
}
