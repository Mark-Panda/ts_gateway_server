// 引入路径模块
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const rootPath = path.resolve(process.cwd());
module.exports = (options) => {
    return {
        // we set the default target accordingly.
        target: 'node',
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
        // 从哪里开始编译
        entry: './src/app.ts',
        // 编译到哪里
        output: {
            libraryTarget: 'commonjs',
            path: path.resolve(__dirname, 'dist/src'),
            filename: 'app.js',
        },
        externals: [/^(?!\.|\/).+/i],
        node: {
            __filename: true,
            __dirname: true,
        },

        // 配置模块规则
        module: {
            rules: [
                {
                    test: /\.tsx?$/, // .ts或者tsx后缀的文件，就是typescript文件
                    use: 'ts-loader', // 就是上面安装的ts-loader
                    exclude: '/node-modules/', // 排除node-modules目录
                },
            ],
        },

        plugins: [
            new CleanWebpackPlugin(['dist']),
            new NodePolyfillPlugin(),
            new CopyWebpackPlugin(
                [
                    { from: 'src/*.yml', to: path.join(rootPath, 'dist') },
                    {
                        from: 'src/public/**/*',
                        to: path.join(rootPath, 'dist'),
                    },
                    { from: 'src/views/**/*', to: path.join(rootPath, 'dist') },
                ],
                options,
            ),
        ],
        // 模式
        mode: 'development',
    };
};
