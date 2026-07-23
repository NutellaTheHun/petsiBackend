import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/PublicRole';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { ReportSchemaDto } from '../dto/report-schema.dto';
import { ReportSchemaService } from '../services/report-schema.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportSchemaController {
    constructor(private readonly service: ReportSchemaService) {}

    @Get('schema')
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    getSchema(): ReportSchemaDto {
        return this.service.getSchema();
    }
}
