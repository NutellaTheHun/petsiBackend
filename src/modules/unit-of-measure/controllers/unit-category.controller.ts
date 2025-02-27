import { Controller } from '@nestjs/common';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { ControllerBase } from '../../../base/controller-base';


@Controller('unit-category')
export class UnitCategoryController extends ControllerBase<UnitCategory> {
  constructor(
      private readonly categoryService: UnitCategoryService
  ){ super(categoryService); }
}
