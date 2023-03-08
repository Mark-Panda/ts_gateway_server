import express, { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import * as bcrypt from 'bcrypt';
import {
    createToken,
    delToken,
    getCacheUserInfo,
    lockCheck,
    setUserOperation,
    updateUserOperation,
    verifyToken,
} from '../util/verify';
import { getUserInfo } from '../util/user';
const router: Router = express.Router();

/**
 * 登录
 */
router.post(
    '/login',
    bodyParser.json(),
    async (req: Request, res: Response) => {
        try {
            const { username, password, loginType } = req.body;
            //获取用户密码
            const dbUserInfo = await getUserInfo(username);
            if (!dbUserInfo) {
                return res.json({
                    code: '',
                    error: '',
                    message: '用户名或密码错误!',
                });
            }
            // 验证用户名和密码 按照实际情况进行密码加解密，使用不同的包
            const isMatch = await bcrypt.compare(password, dbUserInfo.password);
            if (!isMatch) {
                return res.json({
                    code: '',
                    error: '',
                    message: '用户名或密码错误!',
                });
            }
            // 验证用户状态
            if (dbUserInfo.status === 'INACTIVATED') {
                return res.json({
                    code: '',
                    error: '',
                    message: '当前用户未激活!',
                });
            }
            if (dbUserInfo.status === 'LOCK') {
                return res.json({
                    code: '',
                    error: '',
                    message: '用户被系统锁定!',
                });
            }
            if (dbUserInfo.expired && dbUserInfo.expired > 0) {
                if (Date.now() >= dbUserInfo.expired) {
                    return res.json({
                        code: '',
                        error: '',
                        message: '用户已过期!',
                    });
                }
            }

            // 个性化逻辑判断

            // 生成token
            const tokenInfo = await createToken(username, loginType);
            // 存储用户操作信息
            await setUserOperation(username);
            // 返回token信息
            return res.json({ data: tokenInfo });
        } catch (error) {
            return res.json({ code: '', error: '', message: '登录异常' });
        }
    },
);

/**
 * 锁屏登录 Token续租或重新生成
 */
router.put('/login', bodyParser.json(), async (req: Request, res: Response) => {
    try {
        const { username, password, loginType } = req.body;
        // 验证用户名和密码
        //获取用户密码
        const dbUserInfo = await getUserInfo(username);
        if (!dbUserInfo) {
            return res.json({
                code: '',
                error: '',
                message: '用户名或密码错误!',
            });
        }
        // 验证用户名和密码 按照实际情况进行密码加解密，使用不同的包
        const isMatch = await bcrypt.compare(password, dbUserInfo.password);
        if (!isMatch) {
            return res.json({
                code: '',
                error: '',
                message: '用户名或密码错误!',
            });
        }
        // 验证用户状态
        if (dbUserInfo.status === 'INACTIVATED') {
            return res.json({
                code: '',
                error: '',
                message: '当前用户未激活!',
            });
        }
        if (dbUserInfo.status === 'LOCK') {
            return res.json({
                code: '',
                error: '',
                message: '用户被系统锁定!',
            });
        }
        if (dbUserInfo.expired && dbUserInfo.expired > 0) {
            if (Date.now() >= dbUserInfo.expired) {
                return res.json({
                    code: '',
                    error: '',
                    message: '用户已过期!',
                });
            }
        }
        // 如果用户基础信息存在有效期设置，判断用户权限是否过了有效期
        const { pass, minute } = await lockCheck(username);
        // 如果web端支持锁屏，针对web端单独进行锁屏时间判断，锁屏重新登录时，需要删除token重新生成，或者进行token续签
        if (!pass) {
            //判刑
            return res.json({
                code: 'LOCK',
                message: { minute },
                error: `当前用户被锁定登录，请${minute}分钟后再试`,
            });
        }
        // 生成token
        const tokenInfo = await createToken(username, loginType);
        // 存储用户操作信息
        await updateUserOperation(username);
        // 返回token信息
        return res.json({ data: tokenInfo });
    } catch (error) {
        return res.json({ code: '', error: '', msg: '登录异常' });
    }
});

/**
 * 登出
 */
router.post(
    '/logout',
    bodyParser.json(),
    async (req: Request, res: Response) => {
        try {
            const { loginType } = req.body;
            const token = req.headers['x-access-token'];
            // token验证
            // 删除缓存及关联Redis等信息
            await delToken(token, loginType);
            return res.json({ data: { logout: true } });
        } catch (error) {
            return res.json({ error: '', msg: '登出异常' });
        }
    },
);

/**
 * 获取用户信息(登录后)
 */
router.get('/userInfo', async (req: Request, res: Response) => {
    const userTokenPay: any = await verifyToken(req.headers['x-access-token']);
    const userInfo = await getCacheUserInfo(userTokenPay.name);
    return res.json({ data: userInfo });
});

export default router;
