import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../db/redis';
import { verifyToken } from './verify';

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
                    `${userInfo.name}-${req.headers['loginType']}`,
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
