import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMPostgresTestingModule } from '../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../test/mocks/test-request-context.service';
import { RequestContextModule } from '../request-context/request-context.module';
import { RequestContextService } from '../request-context/RequestContextService';
import { ReportDefinitionController } from './controllers/report-definition.controller';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportDefinitionService } from './services/report-definition.service';

export async function getReportsTestingModule(opts?: {
    reportDefinitionServiceClass?: new (...args: any[]) => ReportDefinitionService;
}): Promise<TestingModule> {
    return Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([ReportDefinition]),
            TypeOrmModule.forFeature([ReportDefinition]),
            RequestContextModule,
        ],
        controllers: [ReportDefinitionController],
        providers: [
            opts?.reportDefinitionServiceClass
                ? { provide: ReportDefinitionService, useClass: opts.reportDefinitionServiceClass }
                : ReportDefinitionService,
        ],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile();
}
