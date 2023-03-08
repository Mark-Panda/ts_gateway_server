import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../config';
const { gatewayServe, serveSignURL } = config;
import serviceLocalStorage from '../discovery/local-storage';
import { getServiceHost } from './service';
import { LoggerService } from '../db/log';
const logger = new LoggerService();

/**
 * 动态获取代理目标地址
 */
export const proxyTarget = async (req) => {
    let target = '';
    if (req.proxyServeName) {
        //随机访问地址
        const serverInfo = await getServiceHost(req.proxyServeName);
        if (serverInfo) {
            //拼接target地址
            target =
                'http://' + serverInfo['address'] + ':' + serverInfo['port'];
        }
    }
    req.proxyTargetUrl = target;
    return target;
};

/**
 * 代理规则判断
 * @returns
 */
export const proxyRuleCheck = () => {
    return async (req: any, res: any, next: any) => {
        try {
            // 匹配出当前请求路由
            const baseUrl = req.url.split('?')[0].split('/')[1];
            // 白名单直接过
            const whileUrl = gatewayServe.whileList.filter(
                (fileld: any) => fileld === baseUrl,
            );
            if (whileUrl.length > 0) {
                return next();
            }
            // 根据路由判断需要寻址到哪个微服务上面
            for (const item of serveSignURL) {
                // 找到了对应的微服务
                if (item[baseUrl]) {
                    // 判断当前微服务是否正常运行
                    const serverInfo = serviceLocalStorage.getItem(
                        item[baseUrl],
                    );
                    // 服务正常运行继续
                    if (serverInfo && serverInfo.length > 0) {
                        // 代理转发
                        req.proxyServeName = item[baseUrl];
                        return next();
                    }
                    // 没有运行直接抛出错误提示服务尚未运行
                    return res.json({
                        code: '',
                        error: 'NOSERVER',
                        msg: `${item[baseUrl]}服务未运行`,
                    });
                }
            }
            return res.json({ code: '', error: 'NOAPI', msg: 'API不存在' });
        } catch (error) {
            res.status(401);
            res.json({
                code: '',
                error: 'PROXY_CHECK_ERROR',
                msg: '路由代理规则检查异常',
            });
        }
    };
};

/**
 * 代理转发
 * @returns
 */
export const proxyForward = () => {
    return createProxyMiddleware({
        changeOrigin: true,
        router: async function (req) {
            const url = await proxyTarget(req);
            return url;
        },
        onProxyReq: async function (proxyReq: any, req: any, res: any) {
            logger.debug('服务代理地址:' + req.proxyTargetUrl, 'proxyServer');
            /* 如果req.proxyTargetUrl不存在或者为空字符串，表示代理服务未找到 */
            if (!req.proxyTargetUrl || req.proxyTargetUrl === '') {
                res.json({
                    code: '',
                    error: 'NOSERVER',
                    msg: '服务未启动或不可达!',
                });
            }
            /* 代理前赋值用户角色信息 */
        },
        // onProxyRes: async function (proxyRes: any, req: any, res: any) {
        //     // console.log('----返回', res);
        // },
        onError: async function (err, req, res) {
            logger.error('服务代理异常' + err, 'proxyServer');
            res.json({ code: '', error: 'PROXY_ERROR', msg: '服务请求异常!' });
        },
    });
};
