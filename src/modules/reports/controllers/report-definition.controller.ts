import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/PublicRole';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { CreateReportDefinitionDto } from '../dto/create-report-definition.dto';
import { ExecuteReportDto } from '../dto/execute-report.dto';
import { ReportResultDto } from '../dto/report-result.dto';
import { UpdateReportDefinitionDto } from '../dto/update-report-definition.dto';
import { ReportDefinition } from '../entities/report-definition.entity';
import { ReportExecutionService } from '../services/report-execution.service';
import { ReportDefinitionService } from '../services/report-definition.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports/definitions')
export class ReportDefinitionController {
    constructor(
        private readonly service: ReportDefinitionService,
        private readonly executionService: ReportExecutionService,
    ) {}

    @Post()
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateReportDefinitionDto): Promise<ReportDefinition> {
        return this.service.create(dto);
    }

    @Get()
    @Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
    async findAll(): Promise<ReportDefinition[]> {
        return this.service.findAll();
    }

    @Get(':id')
    @Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReportDefinition> {
        return this.service.findOne(id);
    }

    @Put(':id')
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateReportDefinitionDto,
    ): Promise<ReportDefinition> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.service.remove(id);
    }

    @Post(':id/execute')
    @Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
    @HttpCode(HttpStatus.OK)
    async execute(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ExecuteReportDto,
    ): Promise<ReportResultDto> {
        return this.executionService.execute(id, dto.params ?? {});
    }
}
