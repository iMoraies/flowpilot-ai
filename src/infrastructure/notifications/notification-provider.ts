import type { FastifyBaseLogger } from 'fastify';

export type NotificationMessage = {
  organizationId: string;
  executionId: string;
  message: string;
  channel?: string;
};

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
}

export class LogNotificationProvider implements NotificationProvider {
  public constructor(private readonly logger: FastifyBaseLogger) {}

  public async send(message: NotificationMessage): Promise<void> {
    this.logger.info(
      {
        organizationId: message.organizationId,
        executionId: message.executionId,
        channel: message.channel ?? 'log',
      },
      message.message,
    );
  }
}
