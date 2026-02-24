import { Module } from '@nestjs/common';
import { EventbridgeService } from './services/eventbridge.service';
import { SesService } from './services/ses.service';
import { SqsConsumerService } from './services/sqs-consumer.service';
import { EventsGateway } from './services/events.gateway';

@Module({
  providers: [EventbridgeService, SesService, SqsConsumerService, EventsGateway],
  exports: [EventbridgeService, SesService, EventsGateway],
})
export class AwsModule {}
