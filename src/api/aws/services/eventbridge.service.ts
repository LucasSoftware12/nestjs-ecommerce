import { Injectable, Logger } from '@nestjs/common';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventbridgeService {
  private readonly logger = new Logger(EventbridgeService.name);
  private eventBridgeClient: EventBridgeClient;

  constructor(private configService: ConfigService) {
    this.eventBridgeClient = new EventBridgeClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async publishEvent(eventType: string, detail: any): Promise<void> {
    const params = {
      Entries: [
        {
          Source: 'nestjs-ecommerce',
          DetailType: eventType,
          Detail: JSON.stringify(detail),
          EventBusName: 'default',
        },
      ],
    };

    try {
      const command = new PutEventsCommand(params);
      const data = await this.eventBridgeClient.send(command);
      this.logger.log(`Event ${eventType} sent to EventBridge. ID: ${data.Entries[0].EventId}`);
    } catch (error) {
      this.logger.error(`Error sending event ${eventType} to EventBridge`, error.stack);
    }
  }
}
