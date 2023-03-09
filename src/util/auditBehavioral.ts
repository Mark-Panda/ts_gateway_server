import util from 'util';
import { createAuditTrace } from './audit';
import { redisClient } from '../db/redis';
export const auditBehave = async (req: any, res: any) => {
    try {
        const username = req.user ? req.user.name : 'anonymous';
        const request = { ...req.body };
        const actionId = req.headers['action-id'];
        let response;
        try {
            response = util.isObject(res) ? res : JSON.parse(res);
        } catch (error) {
            response = { data: res };
        }
        //清理秘钥信息
        clearSecretInfo(response);
        clearSecretInfo(request);
        let { workCenter, workStation } = { workCenter: {}, workStation: {} };
        const operational: any = await redisClient.hget(
            `${username}.Operate`,
            'info',
        );
        if (operational.WorkStation) {
            workStation = {
                code: operational.WorkStation.code,
                name: operational.WorkStation.name,
            };
            workCenter = operational.WorkStation.workCenter;
        }

        //审计跟踪记录
        await createAuditTrace({
            actionData: req.body.name || req.body.username || 'null',
            request: JSON.stringify(request),
            response: JSON.stringify(response),
            method: req.method,
            action: actionId || `${req.baseUrl}${req.url}`,
            actionTarget: req.params.target || 'User',
            actionDate: new Date().toISOString(),
            moduleCode: 'tracking',
            username,
            isDelete: false,
            workCenter: JSON.stringify(workCenter),
            workStation: JSON.stringify(workStation),
            description: '用户访问记录',
        });
    } catch (error) {
        console.log(`userTrace:${error.message}`);
    }
};

//清理秘钥信息
function clearSecretInfo(request: any) {
    if (request['password']) {
        request.password = '******';
    }
    if (request['token']) {
        request.token = '******';
    }
    for (const key in request) {
        if (util.isObject(request[key])) {
            clearSecretInfo(request[key]);
        }
    }
}
