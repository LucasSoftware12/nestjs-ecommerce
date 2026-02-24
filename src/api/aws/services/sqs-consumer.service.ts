import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { SesService } from './ses.service';
import { EventsGateway } from './events.gateway';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);
  private sqsClient: SQSClient;
  private queueUrl: string;
  private isPolling = false;

  constructor(
    private configService: ConfigService,
    private sesService: SesService,
    private eventsGateway: EventsGateway,
  ) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
  }

  onModuleInit() {
    this.logger.log('Starting SQS Polling...');
    this.isPolling = true;
    this.pollMessages();
  }

  onModuleDestroy() {
    this.isPolling = false;
    this.logger.log('Stopping SQS Polling...');
  }

  private async pollMessages() {
    while (this.isPolling) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All'],
        });

        const { Messages } = await this.sqsClient.send(command);

        if (Messages && Messages.length > 0) {
          for (const message of Messages) {
            await this.processMessage(message);
            await this.deleteMessage(message.ReceiptHandle);
          }
        }
      } catch (error) {
        this.logger.error('Error polling messages from SQS', error.stack);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async processMessage(message: any) {
    this.logger.log(`Processing message: ${message.MessageId}`);
    try {
      const parsedBody = JSON.parse(message.Body);
      
      const eventType = parsedBody['detail-type'];
      const detail = parsedBody.detail;

      if (eventType === 'user.registered') {
        const email = detail.email;
        if (email) {
          this.logger.log(`Event user.registered received for ${email}. Sending welcome email...`);
          await this.sesService.sendWelcomeEmail(email);
        } else {
          this.logger.warn('Event user.registered received but no email provided in detail');
        }
      } else if (eventType === 'product.activated') {
        const productId = detail.productId;
        const merchantId = detail.merchantId;
        this.logger.log(`Event product.activated received. Product ID: ${productId}, Merchant ID: ${merchantId}`);
        
        this.eventsGateway.notifyNewProduct({ productId, merchantId, ...detail });
      } else {
        this.logger.warn(`Unknown event type received: ${eventType}`);
      }
    } catch (e) {
      this.logger.error(`Failed to process message body: ${message.Body}`, e.stack);
    }
  }

  private async deleteMessage(receiptHandle: string) {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.sqsClient.send(command);
      this.logger.debug('Message deleted from SQS');
    } catch (error) {
           this.logger.error('Error deleting message from SQS', error.stack);
    }
  }
}
