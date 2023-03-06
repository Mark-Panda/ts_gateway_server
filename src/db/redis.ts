import Redis from 'ioredis';
import config from '../config';

/**
 * Redis连接客户端
 */
export const redisClient = new Redis({
    port: config.cacheConfig.port ? config.cacheConfig.port : 6379,
    host: config.cacheConfig.host ? config.cacheConfig.host : 'localhost',
    password: config.cacheConfig.password ? config.cacheConfig.password : null,
    db: config.cacheConfig.db ? config.cacheConfig.db : null,
});
