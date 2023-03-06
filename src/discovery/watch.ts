import Consul from 'consul';
import { LoggerService } from '../db/log';
const logger = new LoggerService();
export class Watch {
    consul: any;
    constructor({ consulhost, consulport }: any) {
        this.consul = new Consul({
            host: consulhost,
            port: consulport,
            promisify: true,
        });
    }
    /**
     * 监控需要的服务
     * @param {*} services
     * @param {*} onChanged
     */
    watch(services: any, onChanged: any) {
        const consul = this.consul;
        if (services === undefined) {
            throw new Error('service 不能为空');
        }
        if (typeof services === 'string') {
            serviceWatch(services);
        } else if (services instanceof Array) {
            services.forEach((service) => {
                serviceWatch(service);
            });
        }
        // 监听服务核心代码
        function serviceWatch(service: any) {
            const watch = consul.watch({
                method: consul.health.service,
                options: {
                    service,
                },
            });
            // 监听服务如果发现，则触发回调方法
            watch.on('change', (data: any) => {
                const result = {
                    name: service,
                    data,
                };
                logger.log(
                    `监听${service}内容有变化：${JSON.stringify(result)}`,
                    'watchServer',
                );
                onChanged(null, result);
            });
            watch.on('error', (error: any) => {
                logger.error(
                    `监听${service}错误,错误的内容为：${error}`,
                    'watchServer',
                );
                onChanged(error, null);
            });
        }
        return this;
    }
}
