import { Module } from '@nestjs/common';
import { LabelService } from './services/label.service';
import { LabelController } from './controllers/label.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './entities/label.entity';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { LabelBuilder } from './builders/label.builder';
import { LabelTestingUtil } from './utils/label-testing.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Label,
    ]),
    MenuItemsModule,
  ],

  controllers: [
    LabelController,
  ],

  providers: [
    LabelService,
    LabelBuilder,
    LabelTestingUtil,
  ],
  
  exports: [
    LabelService,
    LabelTestingUtil,
  ]
})
export class LabelsModule {}
