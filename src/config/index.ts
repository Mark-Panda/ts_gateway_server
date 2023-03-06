import yaml from 'js-yaml';
import fs from 'fs';
import { resolve, join } from 'path';
import { getField, setField } from '../util/index';

const rootPath = resolve(process.cwd());
console.log('----rootPath', __dirname);
const { NODE_ENV } = process.env;
const sysConfig = join(__dirname, '../config.yml');
const sysInfo: any = yaml.load(fs.readFileSync(sysConfig, 'utf8'));

/**
 * 根据环境变量初始化配置信息
 * @param {Object} fieldObject 对象
 * @param {String} fieldPath 路径
 * @param {String} envValue 环境变量值
 * @param {String} defValue 默认值
 */
const initConfigField = (fieldObject, fieldPath, envValue, defValue) => {
    const configFieldValue = getField(fieldObject, fieldPath, defValue);
    setField(fieldObject, fieldPath, envValue || configFieldValue);
};

const config = {
    gatewayServe: sysInfo.gatewayServe,
    consulServe: sysInfo.consulServe,
    serveList: sysInfo.serveList,
    dbConfig: sysInfo.dbConfig,
    cacheConfig: sysInfo.cacheConfig,
    serveSignURL: sysInfo.serveSignURL,
    rootPath,
    staticPath: `${rootPath}/src/public`,
    RuntimeENV: {
        //开发环境
        development: NODE_ENV === 'development',
        //生产环境
        production: NODE_ENV === 'production',
    },
};

// 获取环境变量中consul服务的访问地址
initConfigField(
    config.consulServe,
    'host',
    process.env.CONFIG_CONSULSERVE_HOST,
    '192.168.1.102',
);

// 获取环境变量中consul服务的访问端口
initConfigField(
    config.consulServe,
    'port',
    process.env.CONFIG_CONSULSERVE_PORT,
    8500,
);

export default config;
