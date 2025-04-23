import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from '../services/template.service';
import { TemplateController } from './template.controller';
import { TemplateMenuItemController } from './template-menu-item.controller';
import { TemplateMenuItemService } from '../services/template-menu-item.service';

describe('template menu item controller', () => {
  let controller: TemplateMenuItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateMenuItemController],
      providers: [TemplateMenuItemService],
    }).compile();

    controller = module.get<TemplateMenuItemController>(TemplateMenuItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
