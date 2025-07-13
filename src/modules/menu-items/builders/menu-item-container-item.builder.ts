import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemContainerItemDto } from '../dto/menu-item-container-item/create-menu-item-container-item.dto';
import {
  NestedUpdateMenuItemContainerItemDto,
  UpdateMenuItemContainerItemDto,
} from '../dto/menu-item-container-item/update-menu-item-container-item.dto';
import { MenuItemContainerItem } from '../entities/menu-item-container-item.entity';
import { MenuItemContainerItemService } from '../services/menu-item-container-item.service';
import { MenuItemSizeService } from '../services/menu-item-size.service';
import { MenuItemService } from '../services/menu-item.service';
import { MenuItemContainerItemValidator } from '../validators/menu-item-container-item.validator';

@Injectable()
export class MenuItemContainerItemBuilder extends BuilderBase<MenuItemContainerItem> {
  constructor(
    @Inject(forwardRef(() => MenuItemContainerItemService))
    private readonly componentService: MenuItemContainerItemService,

    @Inject(forwardRef(() => MenuItemService))
    private readonly menuItemService: MenuItemService,

    private readonly itemSizeService: MenuItemSizeService,

    validator: MenuItemContainerItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      MenuItemContainerItem,
      'MenuItemComponentBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateMenuItemContainerItemDto): void {
    if (dto.parentContainerId !== undefined) {
      this.parentContainerById(dto.parentContainerId);
    }
    if (dto.parentContainerSizeId !== undefined) {
      this.parentContainerSizeById(dto.parentContainerSizeId);
    }
    if (dto.containedMenuItemId !== undefined) {
      this.containedItemById(dto.containedMenuItemId);
    }
    if (dto.containedMenuItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedMenuItemSizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  protected updateEntity(dto: UpdateMenuItemContainerItemDto): void {
    if (dto.containedMenuItemId !== undefined) {
      this.containedItemById(dto.containedMenuItemId);
    }
    if (dto.containedMenuItemSizeId !== undefined) {
      this.containedItemSizeById(dto.containedMenuItemSizeId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
  }

  public async buildMany(
    dtos: (
      | CreateMenuItemContainerItemDto
      | NestedUpdateMenuItemContainerItemDto
    )[],
  ): Promise<MenuItemContainerItem[]> {
    const results: MenuItemContainerItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateMenuItemContainerItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        const comp = await this.componentService.findOne(dto.id);
        if (!comp) {
          throw new NotFoundException();
        }
        results.push(await this.buildUpdateDto(comp, dto));
      }
    }
    return results;
  }
  /*
    buildChildEntity(dto: CreateChildMenuItemContainerItemDto): void {
        if (dto.parentContainerSizeId !== undefined) {
            this.parentContainerSizeById(dto.parentContainerSizeId);
        }
        if (dto.containedMenuItemId !== undefined) {
            this.containedItemById(dto.containedMenuItemId);
        }
        if (dto.containedMenuItemSizeId !== undefined) {
            this.containedItemSizeById(dto.containedMenuItemSizeId);
        }
        if (dto.quantity !== undefined) {
            this.quantity(dto.quantity);
        }
    }

    async buildChildCreateDto(parent: MenuItem, dto: CreateChildMenuItemContainerItemDto): Promise<any> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentContainer = parent;

        this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyChildDto(parentContainer: MenuItem, dtos: (CreateChildMenuItemContainerItemDto | UpdateChildMenuItemContainerItemDto)[]): Promise<MenuItemContainerItem[]> {
        const results: MenuItemContainerItem[] = [];
        for (const dto of dtos) {
            if (dto.mode === 'create') {
                results.push(await this.buildChildCreateDto(parentContainer, dto));
            } else {
                const comp = await this.componentService.findOne(dto.id);
                if (!comp) { throw new NotFoundException(); }
                results.push(await this.buildUpdateDto(comp, dto));
            }
        }
        return results;
    }
*/
  public parentContainerById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'parentContainer',
      id,
    );
  }

  public parentContainerByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'parentContainer',
      name,
    );
  }

  public parentContainerSizeById(id: number): this {
    return this.setPropById(
      this.itemSizeService.findOne.bind(this.itemSizeService),
      'parentContainerSize',
      id,
    );
  }

  public containedItemById(id: number): this {
    return this.setPropById(
      this.menuItemService.findOne.bind(this.menuItemService),
      'containedItem',
      id,
    );
  }

  public containedItemByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'containedItem',
      name,
    );
  }

  public containedItemSizeById(id: number): this {
    return this.setPropById(
      this.itemSizeService.findOne.bind(this.itemSizeService),
      'containedItemsize',
      id,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }
}
