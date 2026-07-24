import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../request-context/request-context.module';
import { OrderMenuItem } from '../orders/entities/order-menu-item.entity';
import { ReportDefinitionController } from './controllers/report-definition.controller';
import { ReportSchemaController } from './controllers/report-schema.controller';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportDefinitionService } from './services/report-definition.service';
import { ReportExecutionService } from './services/report-execution.service';
import { ReportSchemaService } from './services/report-schema.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReportDefinition, OrderMenuItem]),
        RequestContextModule,
    ],
    controllers: [ReportDefinitionController, ReportSchemaController],
    providers: [ReportDefinitionService, ReportExecutionService, ReportSchemaService],
    exports: [ReportDefinitionService, ReportExecutionService, ReportSchemaService],
})
export class ReportsModule {}
