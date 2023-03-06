import { Watch } from './watch';
import config from '../config';
const { consulServe, serveList } = config;
console.log('所有微服务列表', serveList);
const watch = new Watch({
    consulhost: consulServe.host,
    consulport: consulServe.port,
});
// 监听服务节点，如果发现变化，则通知主进程的服务列表进行更新
watch.watch(serveList, (_error, data) => {
    process.send(data);
});
