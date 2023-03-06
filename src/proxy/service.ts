import { Discovery } from '../discovery';
import { consulClient } from '../db/consul';
import config from '../config';
const { serveList } = config;
import { random_number } from '../util/index';
const discovery = new Discovery(consulClient);

/**
 * 根据服务名称获取服务对应host
 * @param {String} name 服务名称
 * @returns
 */
export const getServiceHost = async (name: string) => {
    const services = await discovery.getService({ service: name });
    //生成[0,max]任意随机数
    const random = random_number(0, services.length - 1);
    //定义随机数，随机获取ip的负载均衡策略
    const host = services[random];
    return host;
};

/**
 * 获取所有的服务列表信息
 * @returns
 */
export const getServiceList = async () => {
    let allServiceList = [];
    for (const item of serveList) {
        const services = await discovery.getService({ service: item });
        if (services) {
            if (Array.isArray(services)) {
                allServiceList = allServiceList.concat(services);
            } else {
                allServiceList.push(services);
            }
        }
    }
    return allServiceList;
};

/**
 * 检查服务运行状态
 * @param {String} serveName 服务名称
 * @returns
 */
export const checkServiceStatus = async (serveName: string) => {
    const serviceStatus = await discovery.checkServeStatus(serveName);
    return serviceStatus;
};
