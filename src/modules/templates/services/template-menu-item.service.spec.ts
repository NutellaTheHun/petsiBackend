import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { TemplateMenuItemService } from './template-menu-item.service';

describe('Template menu item service', () => {
  let service: TemplateMenuItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateMenuItemService],
    }).compile();

    service = module.get<TemplateMenuItemService>(TemplateMenuItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
