import baseClient from '../db/prisma';

/**
 * 用户名获取用户登录信息
 * @param username 用户名
 * @returns 返回信息
 */
export const getUserInfo = async (username: string) => {
    const dbUserInfo = await baseClient.user.findUnique({
        where: {
            name: username,
        },
        select: {
            password: true,
            status: true,
            expired: true,
        },
    });
    return dbUserInfo;
};

/**
 * 用户名获取用户基础信息
 * @param username 用户名
 * @returns 返回信息
 */
export const getPersonInfo = async (username: string) => {
    const dbPersonInfo = await baseClient.user.findUnique({
        where: {
            name: username,
        },
        select: {
            name: true,
            email: true,
            status: true,
            expired: true,
            role: true,
            person: {
                select: {
                    name: true,
                    organize: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                },
            },
            group: {
                select: {
                    code: true,
                    name: true,
                },
            },
        },
    });
    return dbPersonInfo;
};
