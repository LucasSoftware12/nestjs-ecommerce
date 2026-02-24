import { Module } from '@nestjs/common';
import { EventbridgeService } from './services/eventbridge.service';
import { SesService } from './services/ses.service';
import { SqsConsumerService } from './services/sqs-consumer.service';

@Module({
  providers: [EventbridgeService, SesService, SqsConsumerService],
  exports: [EventbridgeService, SesService],
})
export class AwsModule {}
