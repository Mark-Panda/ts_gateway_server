import express from 'express';
import { fork } from 'child_process';
import path, { join } from 'path';
import config from './config';
import { connectLogger } from 'log4js';
import { LoggerService } from './db/log';
import router from './routers/router';
import { proxyRuleCheck, proxyForward } from './proxy/middle';
import { auditInterceptor, authMiddlware } from './util/middle';
const { gatewayServe, staticPath } = config;
const app = express();

// TODO: 代理graphql请求的话bodyParser中间件会影响代理转发，如果后续仍有问题需要解决
// app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
// app.use(bodyParser.json({ limit: '20mb' }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/**
 * 健康检查 放在每个项目的最开始，不需要走中间件
 */
app.get('/health', (req, res) => {
    return res.end('OK!');
});

//静态资源
app.use(express.static(staticPath));

/**
 * 在网关提供graphql-playground调试界面
 */
app.get('/playground', (req, res) => {
    return res.render('playground', {
        path: '/commonApi/graphql',
        username: 'panda',
    });
});

// 注入日志
const loggerService = new LoggerService();
// 链路追踪
app.use((req: any, res: any, next: any) => loggerService.run(req, next));
app.use(
    connectLogger(loggerService.log4js, {
        level: 'info',
        format: (req, res, format) => {
            const logTraceInfo = {
                TraceId: req.headers.requestId ? req.headers.requestId : '',
                // IP: toIp(req.clientIp),
                Method: req.method,
                Path: req.url,
                Body: req.body,
                ResTime: (res.responseTime || '-') + 'ms',
                HttpStatus: res.statusCode,
                Referrer: req.headers.referer,
            };

            return format(JSON.stringify(logTraceInfo));
        },
    }),
);

/**
 * 鉴权中间件
 */
app.use(authMiddlware());

/**
 * 用户行为操作跟踪
 */
app.all(/\/(resetPassword|login|logout|audit)/, auditInterceptor);

/**
 * 路由代理规则检查中间件
 */
app.use(proxyRuleCheck());

/**
 * 当前服务API必须放在路由转发中间件之前
 */
app.use('/', router);

/**
 * 路由代理转发中间件
 */
app.use(proxyForward());

const watchFile = join(__dirname, '../watch/startWatch');
// fork一个子进程，用于监听服务节点变化
const workerProcess = fork(watchFile);

// 子进程退出
workerProcess.on('exit', function (code) {
    loggerService.log(`服务发现子进程已退出: ${code}`, 'watchServer');
});
workerProcess.on('error', function (error) {
    loggerService.log(`服务发现进程错误: ${error}`, 'watchServer');
});

// 接收变化的服务列表，并更新到缓存中
workerProcess.on('message', (msg: any) => {
    if (msg) {
        loggerService.log(
            `从监控中数据变化：${JSON.stringify(msg)}`,
            'watchServer',
        );
        if (msg.data) {
            const serveList = [];
            for (const serveItem of msg.data) {
                if (serveItem['Checks'][0]['Status'] === 'passing') {
                    const serveInfo = {
                        serveName: serveItem['Service']['Service'],
                        address: serveItem['Service']['Address'],
                        port: serveItem['Service']['Port'],
                        status: serveItem['Checks'][0]['Status'],
                    };
                    serveList.push(serveInfo);
                }
            }
            loggerService.debug(
                `${msg.name}微服务信息: ` + serveList,
                'watchServer',
            );
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceLocalStorage = require('../watch/local-storage');
            //更新缓存中服务列表
            serviceLocalStorage.setItem(msg.name, serveList);
        }
    }
});

app.listen(gatewayServe.port, () => {
    loggerService.log('服务运行端口: ' + gatewayServe.port, 'gatewayServer');
});
