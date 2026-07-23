import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../request-context/request-context.module';
import { ReportDefinitionController } from './controllers/report-definition.controller';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportDefinitionService } from './services/report-definition.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReportDefinition]),
        RequestContextModule,
    ],
    controllers: [ReportDefinitionController],
    providers: [ReportDefinitionService],
    exports: [ReportDefinitionService],
})
export class ReportsModule {}
