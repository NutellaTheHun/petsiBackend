import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { MenuItemComponentValidator } from "../validators/menu-item-component.validator";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { CreateChildMenuItemComponentDto } from "../dto/create-child-menu-item-component.dto";
import { UpdateChildMenuItemComponentDto } from "../dto/update-child-menu-item-component.dto";

@Injectable()
export class MenuItemComponentBuilder extends BuilderBase<MenuItemComponent> 
implements IBuildChildDto<MenuItem, MenuItemComponent> {
    constructor(
        @Inject(forwardRef(() => MenuItemComponentService))
        private readonly componentService: MenuItemComponentService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly menuItemService: MenuItemService,

        private readonly itemSizeService: MenuItemSizeService,
        validator: MenuItemComponentValidator,
    ){ super(MenuItemComponent, validator); }
    
    protected async createEntity(dto: CreateMenuItemComponentDto): Promise<void> {
        if(dto.containerId){
            this.containerById(dto.containerId);
        }
        if(dto.containerSizeId){
            this.containerSizeById(dto.containerSizeId);
        }
        if(dto.menuItemId){
            this.itemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.sizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    protected async updateEntity(dto: UpdateMenuItemComponentDto): Promise<void> {
        if(dto.menuItemId){
            this.itemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.sizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    async buildChildEntity(dto: CreateChildMenuItemComponentDto): Promise<void> {
        if(dto.containerSizeId){
            this.containerSizeById(dto.containerSizeId);
        }
        if(dto.menuItemId){
            this.itemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.sizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    async buildChildCreateDto(parent: MenuItem, dto: CreateChildMenuItemComponentDto): Promise<any> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.container = parent;

        await this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyChildDto(parentContainer: MenuItem, dtos: (CreateChildMenuItemComponentDto | UpdateChildMenuItemComponentDto)[]): Promise<MenuItemComponent[]> {
        const results: MenuItemComponent[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){    
                results.push( await this.buildChildCreateDto(parentContainer, dto));
            } else {
                const comp = await this.componentService.findOne(dto.id);
                if(!comp){ throw new NotFoundException(); }
                results.push( await this.buildUpdateDto(comp, dto));
            }
        }
        return results;
    }

    public containerById(id: number): this{
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'container', id);
    }

    public containerByName(name: string): this{
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'container', name);
    }

    public containerSizeById(id: number): this{
        return this.setPropById(this.itemSizeService.findOne.bind(this.itemSizeService), 'containerSize', id);
    }

    public itemById(id: number): this{
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'item', id);
    }

    public itemByName(name: string): this{
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'item', name);
    }

    public sizeById(id: number): this{
        return this.setPropById(this.itemSizeService.findOne.bind(this.itemSizeService), 'size', id);
    }

    public quantity(amount: number): this{
        return this.setProp('quantity', amount);
    }
}