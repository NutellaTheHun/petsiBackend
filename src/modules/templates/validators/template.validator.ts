import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateTemplateDto } from "../dto/template/create-template.dto";
import { UpdateTemplateDto } from "../dto/template/update-template.dto";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";

@Injectable()
export class TemplateValidator extends ValidatorBase<Template> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,

        @Inject(forwardRef(() => TemplateMenuItemService))
        private readonly itemService: TemplateMenuItemService,
    ) { super(repo); }

    public async validateCreate(dto: CreateTemplateDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'templateName', dto.templateName)) {
            this.addError({
                error: 'Template with that name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateTemplateDto',
                sourceEntity: 'InventoryArea',
                value: dto.templateName,
            } as ValidationError);
        }

        if (dto.templateItemDtos) {

            // no duplicate menuItems
            const duplicateItems = this.helper.findDuplicates(
                dto.templateItemDtos,
                (item) => `${item.menuItemId}`
            );
            if (duplicateItems) {
                for (const dup of duplicateItems) {
                    this.addError({
                        error: 'duplicate menu items on template',
                        status: 'DUPLICATE',
                        contextEntity: 'CreateTemplateDto',
                        sourceEntity: 'MenuItem',
                        sourceId: dup.menuItemId
                    } as ValidationError);
                }
            }

            // no duplicate tablePosIndex
            const duplicatePos = this.helper.findDuplicates(
                dto.templateItemDtos,
                (item) => `${item.tablePosIndex}`
            );
            if (duplicatePos) {
                for (const dup of duplicatePos) {
                    this.addError({
                        error: 'duplicate template row positions',
                        status: 'DUPLICATE',
                        contextEntity: 'CreateTemplateDto',
                        sourceEntity: 'TemplateMenuItem',
                        value: dup.tablePosIndex
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateTemplateDto): Promise<void> {
        if (dto.templateName) {
            if (await this.helper.exists(this.repo, 'templateName', dto.templateName)) {
                this.addError({
                    error: 'Template with that name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateTemplateDto',
                    contextId: id,
                    sourceEntity: 'InventoryArea',
                    value: dto.templateName,
                } as ValidationError);
            }
        }

        if (dto.templateItemDtos) {

            // resolve
            const resolvedItemDtos: number[] = [];
            const resolvedTablePosDtos: number[] = [];
            const resolvedIds: number[] = [];
            for (const d of dto.templateItemDtos) {
                if (d.mode === 'create') {
                    resolvedItemDtos.push(d.menuItemId);
                    resolvedTablePosDtos.push(d.tablePosIndex);
                }
                else if (d.mode === 'update') {
                    const currentItem = await this.itemService.findOne(d.id, ['menuItem'])

                    resolvedItemDtos.push(d.menuItemId ?? currentItem.menuItem.id);
                    resolvedTablePosDtos.push(d.tablePosIndex ?? currentItem.tablePosIndex);
                    resolvedIds.push(d.id);
                }
            }

            // no duplicate menuItems
            const duplicateItems = this.helper.findDuplicates(
                dto.templateItemDtos,
                (item) => `${item.menuItemId}`
            );
            if (duplicateItems) {
                for (const dup of duplicateItems) {
                    this.addError({
                        error: 'duplicate menu items on template',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateTemplateDto',
                        contextId: id,
                        sourceEntity: 'MenuItem',
                        sourceId: dup.menuItemId
                    } as ValidationError);
                }
            }

            // no duplicate tablePosIndex
            const duplicatePos = this.helper.findDuplicates(
                dto.templateItemDtos,
                (item) => `${item.tablePosIndex}`
            );
            if (duplicatePos) {
                for (const dup of duplicatePos) {
                    this.addError({
                        error: 'duplicate template row positions',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateTemplateDto',
                        contextId: id,
                        sourceEntity: 'TemplateMenuItem',
                        value: dup.tablePosIndex
                    } as ValidationError);
                }
            }

            // no multiple update dtos for same entity
            const duplicateIds = this.helper.findDuplicates(
                resolvedIds,
                (id) => `${id}`
            );
            if (duplicateIds) {
                for (const dupId of duplicateIds) {
                    this.addError({
                        error: 'Multiple update requests for the same template item',
                        status: 'INVALID',
                        contextEntity: 'UpdateTemplateDto',
                        contextId: id,
                        sourceEntity: 'TemplateMenuItem',
                        sourceId: dupId,
                    } as ValidationError);
                }
            }
        }

        this.throwIfErrors()
    }
}