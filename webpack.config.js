import webpack from 'webpack';

module.exports = {
    plugins: [
        new webpack.ExternalsPlugin('commonjs', [
            'electron'
        ])
    ]
}
