import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SesService {
  private readonly logger = new Logger(SesService.name);
  private sesClient: SESClient;
  private senderEmail: string;

  constructor(private configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.senderEmail = this.configService.get<string>('AWS_SES_SENDER_EMAIL');
  }

  async sendWelcomeEmail(toEmail: string): Promise<void> {
    const params = {
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <body>
                  <h1>¡Bienvenido a nuestra tienda!</h1>
                  <p>Gracias por registrarte, ${toEmail}. Estamos felices de tenerte aquí.</p>
                </body>
              </html>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `¡Bienvenido a nuestra tienda! Gracias por registrarte, ${toEmail}. Estamos felices de tenerte aquí.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: '¡Bienvenido a nuestro E-commerce!',
        },
      },
      Source: this.senderEmail,
    };

    try {
      const command = new SendEmailCommand(params);
      const data = await this.sesClient.send(command);
      this.logger.log(`Welcome email sent to ${toEmail}. MessageId: ${data.MessageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}. Reason: ${error.message}`, error.stack);
    }
  }
}
