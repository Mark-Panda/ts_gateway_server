import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../config';
import { redisClient } from '../db/redis';
import { getPersonInfo } from './user';

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
    // 删除旧的token
    await redisClient.del(`${username}.${loginType}`);
    // 设置过期时间
    await redisClient.set(`${username}.${loginType}`, token, 'EX', expiresTTL);
    return { expires, token };
};

/**
 * 结构token信息 过期后为null
 * @param {*} token 令牌
 * @returns
 */
export const decodeToken = async (token: any) => {
    const userInfo = jwt.decode(token, config.gatewayServe.token.secret);
    return userInfo;
};

/**
 * 结构token信息,过期后也可以解析内容
 * @param {*} token 令牌
 * @returns
 */
export const verifyToken = async (token: any) => {
    const userInfo = jwt.verify(token, config.gatewayServe.token.secret);
    return userInfo;
};

/**
 * 登出删除token
 * @param {*} token
 */
export const delToken = async (token: any, loginType: any) => {
    const userInfo: any = jwt.decode(token, config.gatewayServe.token.secret);
    //删除token
    await redisClient.del(`${userInfo.name}.${loginType}`);
    // 删除用户操作信息
    await redisClient.hdel(`${userInfo.name}.UserInfo`);
};

/**
 * 依据用户名和登录客户端类型删除token
 * @param username 用户名
 * @param loginType 客户端类型
 */
export const delTokenByName = async (username: any, loginType: any) => {
    //删除token
    await redisClient.del(`${username}.${loginType}`);
    // 删除用户操作信息
    await redisClient.hdel(`${username}.UserInfo`);
};

/**
 * 锁屏检查
 * @param username 用户名
 * @returns 返回信息
 */
export const lockCheck = async (username: string) => {
    //查询Redis信息
    const userOperation: any = await redisClient.hgetall(
        `${username}.UserInfo`,
    );
    const pass = !userOperation.waiting || userOperation.waiting <= Date.now();
    if (userOperation.waiting && userOperation.waiting <= Date.now()) {
        await redisClient.hdel(`${username}.UserInfo`);
    }
    return {
        pass,
        minute:
            !pass &&
            new Date(userOperation.waiting - Date.now()).getMinutes() + 1,
    };
};

/**
 * 用户操作信息缓存
 * @param username 用户名
 * @param operation 用户操作信息
 */
export const setUserOperation = async (username: string) => {
    const userBaseInfo: any = await getPersonInfo(username);
    userBaseInfo.waiting = moment()
        .add(config.gatewayServe.login.waiting, 'minutes')
        .valueOf();
    await redisClient.hmset(`${username}.UserInfo`, [
        'info',
        JSON.stringify(userBaseInfo),
    ]);
};

/**
 * 更新用户操作锁屏时间缓存
 * @param username 用户名
 * @param operation 用户操作信息
 */
export const updateUserOperation = async (username: string) => {
    let operatInfo: any = await redisClient.hget(
        `${username}.UserInfo`,
        'info',
    );
    operatInfo = JSON.parse(operatInfo);
    operatInfo.waiting = moment()
        .add(config.gatewayServe.login.waiting, 'minutes')
        .valueOf();
    await redisClient.hmset(`${username}.UserInfo`, [
        'info',
        JSON.stringify(operatInfo),
    ]);
};

/**
 * 获取缓存中的用户信息
 * @param username 用户名
 * @returns 返回信息
 */
export const getCacheUserInfo = async (username: string) => {
    return await redisClient.hget(`${username}.UserInfo`, 'info');
};
