import serviceLocalStorage from './local-storage';
import { LoggerService } from '../db/log';
const logger = new LoggerService();

/**
 * 服务发现
 */
export class Discovery {
    consul: any;
    constructor(consulClient: any) {
        this.consul = consulClient;
    }
    /**
     * 根据名称获取服务
     * @param {*} opts
     */
    async getService(opts: { service: any }) {
        const { service } = opts;
        // 从缓存中获取列表
        const services = serviceLocalStorage.getItem(service);
        if (services && services.length > 0) {
            logger.log(
                `命中缓存，key:${service},value:${JSON.stringify(services)}`,
                'watchServer',
            );
            return services;
        }
        //如果缓存不存在，则获取远程数据
        const serverStatus = await this.consul.getHealthServe(service);
        logger.log(
            `获取服务端数据，key：${service}：value:${JSON.stringify(
                serverStatus,
            )}`,
            'watchServer',
        );
        const serveList = [];
        for (const serveItem of serverStatus) {
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
        serviceLocalStorage.setItem(service, serveList);
        return serveList;
    }

    /**
     * 直接在consul中查看服务运行状态
     * @param {*} serveName
     */
    async checkServeStatus(serveName: any) {
        const serverStatus = await this.consul.getHealthServe(serveName);
        return serverStatus;
    }
}
