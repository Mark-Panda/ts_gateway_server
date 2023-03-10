import { PrismaClient } from '@auditprisma/client';
import config from '../config';
import { LoggerService } from './log';
const logger = new LoggerService();

/**
 * 审计客户端
 */
const auditClient = new PrismaClient({
    errorFormat: 'colorless',
    datasources: {
        db: {
            url: config.dbConfig.postgreLink, //覆盖@prisma/client方式
        },
    },
    log: [
        {
            emit: 'event',
            level: 'query',
        },
    ],
});

const { NODE_ENV } = process.env;
if (NODE_ENV !== 'production') {
    auditClient.$on('query', (event) => {
        logger.debug(event, '查询日志');
    });
}

export default auditClient;
