import { TestingModule } from "@nestjs/testing";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";
import { TemplateTestingUtil } from "../utils/template-testing.util";
import { TemplateValidator } from "./template.validator";
import { TemplateService } from "../services/template.service";
import { getTemplateTestingModule } from "../utils/template-testing.module";
import { CreateTemplateDto } from "../dto/template/create-template.dto";
import { UpdateTemplateDto } from "../dto/template/update-template.dto";
import { CreateChildTemplateMenuItemDto } from "../dto/template-menu-item/create-child-template-menu-item.dto";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { item_a, item_b, item_c } from "../../menu-items/utils/constants";
import { template_a, template_b } from "../utils/constants";
import { UpdateChildTemplateMenuItemDto } from "../dto/template-menu-item/update-child-template-menu-item.dto";

describe('template validator', () => {
    let testingUtil: TemplateTestingUtil;
    let dbTestContext: DatabaseTestContext;

    let validator: TemplateValidator;
    let templateService: TemplateService;
    let menuItemService: MenuItemService;

    beforeAll(async () => {
        const module: TestingModule = await getTemplateTestingModule();
        validator = module.get<TemplateValidator>(TemplateValidator);

        templateService = module.get<TemplateService>(TemplateService);
        menuItemService = module.get<MenuItemService>(MenuItemService);

        dbTestContext = new DatabaseTestContext();
        testingUtil = module.get<TemplateTestingUtil>(TemplateTestingUtil);
        await testingUtil.initTemplateMenuItemTestDatabase(dbTestContext);
    });

    afterAll(async () => {
        await dbTestContext.executeCleanupFunctions();
    });
    
    it('should be defined', () => {
        expect(validator).toBeDefined
    });

    it('should validate create', async () => {
        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as CreateChildTemplateMenuItemDto,

        ] as CreateChildTemplateMenuItemDto[];
        const dto = {
            templateName: "CREATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as CreateTemplateDto;

        const result = await validator.validateCreate(dto);

        expect(result).toBeNull();
    });

    it('should fail create: duplicate menuItems', async () => {
        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "A2",
                menuItemId: itemA.id,
                tablePosIndex: 3,
            } as CreateChildTemplateMenuItemDto,

        ] as CreateChildTemplateMenuItemDto[];
        const dto = {
            templateName: "CREATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as CreateTemplateDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual('template cannot have items with multiple menuItems');
    });

    it('should fail create: duplicate TablePosIndex', async () => {
        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }
        const itemC = await menuItemService.findOneByName(item_c);
        if(!itemC){ throw new Error(); }


        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "A2",
                menuItemId: itemC.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,

        ] as CreateChildTemplateMenuItemDto[];
        const dto = {
            templateName: "CREATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as CreateTemplateDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual('template cannot have items with duplicate tablePosIndex values');
    });

    it('should fail create: Name exists', async () => {
        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as CreateChildTemplateMenuItemDto,

        ] as CreateChildTemplateMenuItemDto[];
        const dto = {
            templateName: template_a,
            isPie: true,
            templateItemDtos: itemDtos,
        } as CreateTemplateDto;

        const result = await validator.validateCreate(dto);

        expect(result).toEqual(`Template with name ${template_a} already exists`);
    });

    it('should pass update', async () => {
        const toUpdate = await templateService.findOneByName(template_a, ['templateItems']);
        if(!toUpdate){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'update',
                id: toUpdate.templateItems[0].id,
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as UpdateChildTemplateMenuItemDto,

        ] as (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
        const dto = {
            templateName: "UPDATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as UpdateTemplateDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toBeNull();
    });

    it('should fail update: duplicate menuItems', async () => {
        const toUpdate = await templateService.findOneByName(template_a, ['templateItems']);
        if(!toUpdate){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'update',
                id: toUpdate.templateItems[0].id,
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as UpdateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B2",
                menuItemId: itemB.id,
                tablePosIndex: 3,
            } as CreateChildTemplateMenuItemDto,
        ] as (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
        const dto = {
            templateName: "UPDATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as UpdateTemplateDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('template cannot have items with multiple menuItems');
    });

    it('should fail update: duplicate TablePosIndex', async () => {
        const toUpdate = await templateService.findOneByName(template_a, ['templateItems']);
        if(!toUpdate){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }
        const itemC = await menuItemService.findOneByName(item_c);
        if(!itemC){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'update',
                id: toUpdate.templateItems[0].id,
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as UpdateChildTemplateMenuItemDto,
            {
                mode: 'create',
                displayName: "B2",
                menuItemId: itemC.id,
                tablePosIndex: 2,
            } as CreateChildTemplateMenuItemDto,
        ] as (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
        const dto = {
            templateName: "UPDATE",
            isPie: true,
            templateItemDtos: itemDtos,
        } as UpdateTemplateDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual('template cannot have items with duplicate tablePosIndex values');
    });

    it('should fail update: Name exists', async () => {
        const toUpdate = await templateService.findOneByName(template_a, ['templateItems']);
        if(!toUpdate){ throw new Error(); }

        const itemA = await menuItemService.findOneByName(item_a);
        if(!itemA){ throw new Error(); }
        const itemB = await menuItemService.findOneByName(item_b);
        if(!itemB){ throw new Error(); }

        const itemDtos = [
            {
                mode: 'create',
                displayName: "A",
                menuItemId: itemA.id,
                tablePosIndex: 1,
            } as CreateChildTemplateMenuItemDto,
            {
                mode: 'update',
                id: toUpdate.templateItems[0].id,
                displayName: "B",
                menuItemId: itemB.id,
                tablePosIndex: 2,
            } as UpdateChildTemplateMenuItemDto,

        ] as (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[];
        const dto = {
            templateName: template_b,
            isPie: true,
            templateItemDtos: itemDtos,
        } as UpdateTemplateDto;

        const result = await validator.validateUpdate(toUpdate.id, dto);
        expect(result).toEqual(`Template with name ${template_b} already exists`);
    });
});