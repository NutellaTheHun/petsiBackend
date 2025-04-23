import { Module } from '@nestjs/common';
import { TemplateService } from './services/template.service';
import { TemplateController } from './controllers/template.controller';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplatesModule {}
