import { Module } from '@nestjs/common';
import { UnitOfMeasureService } from './unit-of-measure.service';

@Module({
  providers: [UnitOfMeasureService]
})
export class UnitOfMeasureModule {}
