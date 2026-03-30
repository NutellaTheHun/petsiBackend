import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionHistory } from './entities/revision-history.entity';
import { RevisionHistoryService } from './revision-history.service';

@Module({
    imports: [TypeOrmModule.forFeature([RevisionHistory])],
    providers: [RevisionHistoryService],
    exports: [RevisionHistoryService, TypeOrmModule],
})
export class RevisionHistoryModule {}
