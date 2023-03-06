import { v4 as uuidv4 } from 'uuid';
import { Logger, Configuration, configure, getLogger } from 'log4js';
import { AsyncLocalStorage } from 'async_hooks';
const asyncLocalStorage = new AsyncLocalStorage();

export type LoggerServiceOptions = Partial<Configuration> & {
    filename: string;
};

/**
 * 拓展日志服务
 * 加入 log4js 日志文件写入
 */
export class LoggerService {
    log4js: Logger;
    filename: string;

    constructor(options?: LoggerServiceOptions) {
        const { filename = 'logs/all.log', ..._options } = options || {};
        this.filename = filename;
        configure({
            appenders: {
                all: {
                    filename,
                    type: 'dateFile',
                    // 配置 layout，此处使用自定义模式 pattern
                    layout: { type: 'pattern', pattern: '%d [%p] %m' },
                    // 日志文件按日期（天）切割
                    pattern: 'yyyy-MM-dd',
                    // 回滚旧的日志文件时，保证以 .log 结尾 （只有在 alwaysIncludePattern 为 false 生效）
                    keepFileExt: true,
                    // 输出的日志文件名是都始终包含 pattern 日期结尾
                    alwaysIncludePattern: true,
                    // 指定日志保留的天数
                    numBackups: 1,
                },
            },
            categories: { default: { appenders: ['all'], level: 'all' } },
            ..._options,
        });

        this.log4js = getLogger();
    }

    // 链路追踪
    run(req: any, callback: any) {
        req.headers.requestId = req.headers.requestId || uuidv4();
        // 借助链路追踪功能，存放当前请求的信息，可以用于实现数据库层审计，判断当前操作信息
        // TODO: 定义一个链路信息的结构类型
        const storeInfo = {
            traceId: req.headers.requestId,
            operator: req.headers.authorizer || '系统管理员',
        };
        asyncLocalStorage.run(storeInfo, callback);
    }
    /**
     * 业务日志
     * @param message
     * @param trace
     */
    log(message: any, trace: string) {
        const traceInfo: any = asyncLocalStorage.getStore();
        const traceId =
            traceInfo && traceInfo.traceId ? '[' + traceInfo.traceId + ']' : '';
        this.log4js.info(traceId + trace, message);
    }
    /**
     * 错误日志
     * @param message
     * @param trace
     */
    error(message: any, trace: string) {
        const traceInfo: any = asyncLocalStorage.getStore();
        const traceId =
            traceInfo && traceInfo.traceId ? '[' + traceInfo.traceId + ']' : '';
        this.log4js.error(traceId + trace, message);
    }
    /**
     * 异常日志
     * @param message
     * @param trace
     */
    warn(message: any, trace: string) {
        const traceInfo: any = asyncLocalStorage.getStore();
        const traceId =
            traceInfo && traceInfo.traceId ? '[' + traceInfo.traceId + ']' : '';
        this.log4js.warn(traceId + trace, message);
    }
    /**
     * 测试日志
     * @param message
     * @param trace
     */
    debug(message: any, trace: string) {
        const traceInfo: any = asyncLocalStorage.getStore();
        const traceId =
            traceInfo && traceInfo.traceId ? '[' + traceInfo.traceId + ']' : '';
        this.log4js.debug(traceId + trace, message);
    }

    verbose(message: any, trace: string) {
        const traceInfo: any = asyncLocalStorage.getStore();
        const traceId =
            traceInfo && traceInfo.traceId ? '[' + traceInfo.traceId + ']' : '';
        this.log4js.info(traceId + trace, message);
    }
}
