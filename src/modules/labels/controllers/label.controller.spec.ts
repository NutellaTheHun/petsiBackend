import { Test, TestingModule } from '@nestjs/testing';
import { LabelService } from '../services/label.service';
import { LabelController } from './label.controller';
import { getLabelsTestingModule } from '../utils/label-testing.module';
import { Label } from '../entities/label.entity';

describe('Label  Controller', () => {
  let controller: LabelController;
  let service: LabelService;

  let labels: Label[];
  let labelId: number = 1;

  beforeEach(async () => {
    const module: TestingModule = await getLabelsTestingModule();

    controller = module.get<LabelController>(LabelController);
    service = module.get<LabelService>(LabelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
