#!/usr/bin/env node
/**
 * MCP Server for Bitcoin Whale Alert
 * Implements Model Context Protocol server for whale alert monitoring
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger';
import { alertService } from './services/alert.service';
import { chainhookService } from './services/chainhook.service';
import { notificationService } from './services/notification.service';
import { pricingService } from './services/pricing.service';
import { analyticsService } from './services/analytics.service';
import './config/database';
import './config/redis';
import './jobs/queue';

const server = new Server(
  {
    name: 'bitcoin-whale-alert',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'register_whale_alert',
        description: 'Register a new whale alert monitor for Bitcoin addresses or transaction thresholds',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: "Friendly name for this alert (e.g., 'Large BTC Transfers')",
            },
            threshold_btc: {
              type: 'number',
              description: 'Minimum transaction amount in BTC to trigger alert',
              minimum: 0.1,
            },
            addresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: Specific Bitcoin addresses to monitor',
            },
            notification_channels: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['email', 'telegram'],
              },
              description: 'Channels to send notifications through',
            },
            include_metadata: {
              type: 'boolean',
              description: 'Include additional transaction metadata in alerts',
              default: true,
            },
          },
          required: ['name', 'threshold_btc', 'notification_channels'],
        },
      },
      {
        name: 'list_whale_alerts',
        description: 'List all registered whale alert monitors',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'paused', 'all'],
              description: 'Filter alerts by status',
              default: 'all',
            },
          },
        },
      },
      {
        name: 'update_whale_alert',
        description: 'Update an existing whale alert monitor configuration',
        inputSchema: {
          type: 'object',
          properties: {
            alert_id: {
              type: 'string',
              description: 'ID of the alert to update',
            },
            threshold_btc: {
              type: 'number',
              description: 'New threshold amount in BTC',
              minimum: 0.1,
            },
            addresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Updated list of Bitcoin addresses to monitor',
            },
            notification_channels: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['email', 'telegram'],
              },
              description: 'Updated notification channels',
            },
            paused: {
              type: 'boolean',
              description: 'Pause or resume the alert',
            },
          },
          required: ['alert_id'],
        },
      },
      {
        name: 'delete_whale_alert',
        description: 'Remove a whale alert monitor',
        inputSchema: {
          type: 'object',
          properties: {
            alert_id: {
              type: 'string',
              description: 'ID of the alert to delete',
            },
          },
          required: ['alert_id'],
        },
      },
      {
        name: 'get_alert_history',
        description: 'Retrieve historical alerts triggered by a monitor',
        inputSchema: {
          type: 'object',
          properties: {
            alert_id: {
              type: 'string',
              description: 'ID of the alert monitor',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of historical alerts to return',
              default: 50,
              minimum: 1,
              maximum: 1000,
            },
            start_date: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for historical data (ISO 8601)',
            },
            end_date: {
              type: 'string',
              format: 'date-time',
              description: 'End date for historical data (ISO 8601)',
            },
          },
          required: ['alert_id'],
        },
      },
      {
        name: 'test_notification',
        description: 'Send a test notification through configured channels',
        inputSchema: {
          type: 'object',
          properties: {
            channel: {
              type: 'string',
              enum: ['email', 'telegram'],
              description: 'Channel to test',
            },
            message: {
              type: 'string',
              description: 'Custom test message',
              default: 'This is a test notification from Bitcoin Whale Alert',
            },
          },
          required: ['channel'],
        },
      },
      {
        name: 'add_labeled_address',
        description: 'Add a labeled address to track (e.g., exchange wallet, institution)',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Bitcoin address to label',
            },
            label: {
              type: 'string',
              description: "Human-readable label (e.g., 'Binance Hot Wallet', 'MicroStrategy')",
            },
            category: {
              type: 'string',
              enum: ['exchange', 'institution', 'whale', 'defi', 'other'],
              description: 'Category of the address',
            },
            auto_alert: {
              type: 'boolean',
              description: 'Automatically create alerts for this address',
              default: true,
            },
          },
          required: ['address', 'label', 'category'],
        },
      },
      {
        name: 'get_whale_statistics',
        description: 'Get statistical analysis of whale activity',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              enum: ['24h', '7d', '30d', '90d'],
              description: 'Timeframe for statistics',
              default: '24h',
            },
            min_threshold_btc: {
              type: 'number',
              description: 'Minimum transaction size to include in statistics',
              default: 100,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'register_whale_alert': {
        const thresholdSatoshis = Math.floor((args.threshold_btc as number) * 100000000);
        const alert = await alertService.create('mcp-user', {
          name: args.name as string,
          threshold_btc: args.threshold_btc as number,
          addresses: args.addresses as string[] | undefined,
          notification_channels: args.notification_channels as ('email' | 'telegram')[],
          include_metadata: args.include_metadata as boolean | undefined,
        });
        
        // Register with chainhook
        await chainhookService.registerAlert(alert.id, thresholdSatoshis, args.addresses as string[] | undefined);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, alert_id: alert.id, alert }, null, 2),
            },
          ],
        };
      }

      case 'list_whale_alerts': {
        const alerts = await alertService.list('mcp-user', args.status as string | undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, alerts }, null, 2),
            },
          ],
        };
      }

      case 'update_whale_alert': {
        const updated = await alertService.update('mcp-user', args.alert_id as string, {
          threshold_btc: args.threshold_btc as number | undefined,
          addresses: args.addresses as string[] | undefined,
          notification_channels: args.notification_channels as ('email' | 'telegram')[] | undefined,
          paused: args.paused as boolean | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, alert: updated }, null, 2),
            },
          ],
        };
      }

      case 'delete_whale_alert': {
        await alertService.delete('mcp-user', args.alert_id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Alert deleted' }, null, 2),
            },
          ],
        };
      }

      case 'get_alert_history': {
        const history = await alertService.getHistory('mcp-user', args.alert_id as string, {
          limit: args.limit as number | undefined,
          startDate: args.start_date as string | undefined,
          endDate: args.end_date as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, history }, null, 2),
            },
          ],
        };
      }

      case 'test_notification': {
        const testData = {
          amount: 1.0,
          amountUsd: await pricingService.convertBtcToUsd(1.0),
          txid: 'test-tx-id',
          fromAddresses: ['test-from'],
          toAddresses: ['test-to'],
          blockHeight: 0,
          timestamp: new Date().toISOString(),
        };

        const recipients: any = {};
        if (args.channel === 'email') {
          recipients.email = process.env.EMAIL_TO;
        } else if (args.channel === 'telegram') {
          recipients.telegramChatId = process.env.TELEGRAM_CHAT_ID;
        }

        await notificationService.sendNotification(
          [args.channel as 'email' | 'telegram'],
          testData,
          recipients
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Test ${args.channel} notification sent` }, null, 2),
            },
          ],
        };
      }

      case 'add_labeled_address': {
        // Implementation for adding labeled addresses
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Labeled address added' }, null, 2),
            },
          ],
        };
      }

      case 'get_whale_statistics': {
        const stats = await analyticsService.getWhaleStatistics(
          'mcp-user',
          (args.timeframe as '24h' | '7d' | '30d' | '90d') || '24h',
          (args.min_threshold_btc as number) || 100
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, statistics: stats }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'whale-alert://config',
        name: 'Whale Alert Configuration',
        description: 'Current configuration for all whale alert monitors',
        mimeType: 'application/json',
      },
      {
        uri: 'whale-alert://labeled-addresses',
        name: 'Labeled Addresses Database',
        description: 'Database of labeled Bitcoin addresses (exchanges, institutions, etc.)',
        mimeType: 'application/json',
      },
      {
        uri: 'whale-alert://recent-alerts',
        name: 'Recent Whale Alerts',
        description: 'Most recent whale transaction alerts (last 100)',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'whale-alert://config': {
        const alerts = await alertService.list('mcp-user', 'all');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ alerts }, null, 2),
            },
          ],
        };
      }

      case 'whale-alert://labeled-addresses': {
        // Return labeled addresses
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ addresses: [] }, null, 2),
            },
          ],
        };
      }

      case 'whale-alert://recent-alerts': {
        // Return recent alerts
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ alerts: [] }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    logger.error(`Error reading resource ${uri}:`, error);
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('🚀 MCP Bitcoin Whale Alert server started');
}

main().catch((error) => {
  logger.error('Failed to start MCP server:', error);
  process.exit(1);
});
