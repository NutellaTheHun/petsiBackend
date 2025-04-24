import { Injectable } from '@nestjs/common';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';
import { ServiceBase } from '../../../base/service-base';
import { Label } from '../entities/label.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LabelBuilder } from '../builders/label.builder';

@Injectable()
export class LabelService extends ServiceBase<Label>{
  constructor(
    @InjectRepository(Label)
    private readonly labelRepo: Repository<Label>,
    private readonly labelBuilder: LabelBuilder,
  ){ super(labelRepo); }

  
}
