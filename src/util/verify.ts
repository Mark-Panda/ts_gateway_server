import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../config';
import { redisClient } from '../db/redis';

/**
 * 创建令牌
 * @param {*} username 用户名
 * @param {*} loginType 登录方式 mobile webApp webAdmin win
 * @returns
 */
export const createToken = async (username: any, loginType: any) => {
    //计算过期时间
    const expires = moment()
        .add(config.gatewayServe.token.expires, 'days')
        .valueOf();
    const token = jwt.sign(
        {
            name: username,
            loginType: loginType ? loginType : 'webApp',
            exp: expires,
        },
        config.gatewayServe.token.secret,
    );
    const expiresTTL = config.gatewayServe.token.expires * 24 * 60 * 60; //秒
    // 设置过期时间
    await redisClient.set(`${username}-${loginType}`, token, 'EX', expiresTTL);
    return { expires, token };
};

/**
 * 结构token信息
 * @param {*} token 令牌
 * @returns
 */
export const decodeToken = async (token: any) => {
    const userInfo = jwt.decode(token, config.gatewayServe.token.secret);
    return userInfo;
};

/**
 * 登出删除token
 * @param {*} token
 */
export const delToken = async (token: any, loginType: any) => {
    const userInfo: any = jwt.decode(token, config.gatewayServe.token.secret);
    await redisClient.del(`${userInfo.name}-${loginType}`);
};
