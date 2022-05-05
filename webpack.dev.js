const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: './src/scripts/main.js',
	output: {
		filename: '[contenthash].js',
		assetModuleFilename: 'assets/[contenthash][ext]',
	},
	devtool: false,
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: ['@babel/plugin-transform-runtime'],
						cacheDirectory: true,
					},
				},
			},
			{
				test: /\.html$/,
				use: 'html-loader',
			},
			{
				test: /\.s(c|a)ss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: 'asset/resource',
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/template.html',
			favicon: './src/icons/favicon.ico',
		}),
	],
};
