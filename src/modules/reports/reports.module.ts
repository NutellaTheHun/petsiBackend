import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../request-context/request-context.module';
import { ReportDefinitionController } from './controllers/report-definition.controller';
import { ReportSchemaController } from './controllers/report-schema.controller';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportDefinitionService } from './services/report-definition.service';
import { ReportSchemaService } from './services/report-schema.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReportDefinition]),
        RequestContextModule,
    ],
    controllers: [ReportDefinitionController, ReportSchemaController],
    providers: [ReportDefinitionService, ReportSchemaService],
    exports: [ReportDefinitionService, ReportSchemaService],
})
export class ReportsModule {}
