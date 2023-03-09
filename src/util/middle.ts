import { Request, Response, NextFunction } from 'express';
import interceptor from 'express-interceptor';
import { verifyToken } from './verify';
import { redisClient } from '../db/redis';
import { auditBehave } from './auditBehavioral';
import { getPersonInfo } from './user';

/**
 * 登录鉴权
 * @param req 请求信息
 * @param res 相应信息
 */
export const authMiddlware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers['x-access-token'];
            if (token) {
                const userInfo: any = await verifyToken(token);
                // 判断token是否在Redis中存在
                const cacheToken = await redisClient.get(
                    `${userInfo.name}.${req.headers['loginType']}`,
                );
                // token在Redis中不存在
                if (!cacheToken) {
                    res.json({
                        code: '',
                        error: '',
                        message: '用户令牌信息不存在,请重新登陆!',
                    });
                }
                // token信息不匹配
                if (cacheToken !== token) {
                    res.json({
                        code: '',
                        error: '',
                        message: '令牌信息不合法,请重新登陆!',
                    });
                }
                //验证Token过期
                if (userInfo.exp <= Date.now()) {
                    res.json({
                        code: '',
                        error: '',
                        message: '令牌已失效,请重新登陆!',
                    });
                }
                // 将信息放到请求信息中方便后续获取 TODO: 是否需要加密,防止外部直接模拟
                // 从Redis中获取或者直接查数据库
                const userCacheInfo: any = await redisClient.hget(
                    `${userInfo.name}.UserInfo`,
                    'info',
                );
                if (userCacheInfo) {
                    req['user'] = userCacheInfo;
                } else {
                    const userBaseInfo: any = await getPersonInfo(
                        userInfo.name,
                    );
                    req['user'] = userBaseInfo;
                }
                next();
            } else {
                res.json({
                    code: '',
                    error: '',
                    message: '令牌缺失,请重新登陆!',
                });
            }
        } catch (error) {
            res.json({ code: '', error: '', message: '令牌验证的未知错误!' });
        }
    };
};

/**
 * 用户行为操作跟踪
 */
export const auditInterceptor = interceptor(function (req: any) {
    return {
        isInterceptable: () => true,
        intercept: async function (body: any, send: any) {
            await auditBehave(req, body);
            send(body);
        },
    };
});
