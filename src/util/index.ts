import os from 'os';
/**
 * 根据路径获得属性,支持数组
 * @param {object} obj 对象
 * @param {string} path 路径
 * @param {string} def 默认值
 */
export function getField(obj: object, path: any, def: string) {
    /**
     * If the path is a string, convert it to an array
     * @param  {String|Array} path The path
     * @return {Array}             The path array
     */
    const stringToPath = function (path: string | Array<any>): Array<any> {
        // If the path isn't a string, return it
        if (typeof path !== 'string') return path;

        // Create new array
        const output = [];

        // Split to an array with dot notation
        path.split('.').forEach(function (item, _index) {
            // Split to an array with bracket notation
            item.split(/\[([^}]+)\]/g).forEach(function (key) {
                // Push to the new array
                if (key.length > 0) {
                    output.push(key);
                }
            });
        });

        return output;
    };

    // Get the path as an array
    path = stringToPath(path);

    // Cache the current object
    let current = obj;

    // For each item in the path, dig into the object
    for (let i = 0; i < path.length; i++) {
        // If the item isn't found, return the default (or null)
        if (current[path[i]] === undefined) return def;

        // Otherwise, update the current  value
        current = current[path[i]];
    }
    return current;
}

/**
 * 为对象添加属性
 * @param {Object} obj 对象
 * @param {String} keyPath 路径
 * @param {Object} value 值
 */
export function setField(obj: object, keyPath: string, value: object) {
    //匹配出属性名
    const array = keyPath.match(/\w+/g);
    //遍历属性名数组
    // eslint-disable-next-line no-var
    for (var i = 0; i < array.length - 1; i++) {
        const cur = array[i];
        const next = array[i + 1];
        //创建对象
        if (!obj[cur]) {
            //如果要创建的是对象
            if (isNaN(parseInt(next))) {
                obj[cur] = {};
            } //如果要创建的是数组
            else {
                obj[cur] = [];
            }
        }
        //obj指向新创建的对象
        obj = obj[cur];
    }
    //最后一步赋值
    obj[array[i]] = value;
}

/**
 * 获取当前机器的ip地址
 */
export function getIpAddress() {
    const ifaces = os.networkInterfaces();
    for (const dev in ifaces) {
        const iface = ifaces[dev];
        for (let i = 0; i < iface.length; i++) {
            const { family, address, internal } = iface[i];
            if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
                return address;
            }
        }
    }
}

/**
 * 范围内随机数
 * @param {*} min 最小值
 * @param {*} max 最大值
 * @returns
 */
export function random_number(min: any, max: any) {
    const range = max - min;
    const rand = Math.random();
    const num = min + Math.round(rand * range);
    return num;
}
