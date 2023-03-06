import { PrismaClient } from '@prisma/client';
import config from '../config';
import { LoggerService } from './log';
const logger = new LoggerService();

/**
 * 业务逻辑模块客户端
 */
const baseClient = new PrismaClient({
    errorFormat: 'colorless',
    datasources: {
        db: {
            url: config.dbConfig.link, //覆盖@prisma/client方式
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
    baseClient.$on('query', (event) => {
        logger.debug(event, '查询日志');
    });
}

export default baseClient;
