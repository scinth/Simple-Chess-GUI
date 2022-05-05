const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: './src/scripts/main.js',
	output: {
		filename: 'index-[contenthash].bundle.min.js',
		path: path.resolve(__dirname, 'dist'),
		assetModuleFilename: 'assets/[contenthash][ext]',
	},
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
				use: ['html-loader'],
			},
			{
				test: /\.s(c|a)ss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
			},
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: 'asset/resource',
			},
		],
	},
	optimization: {
		minimizer: [new TerserPlugin(), new OptimizeCssAssetsPlugin()],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/template.html',
			minify: {
				removeAttributeQuotes: true,
				removeComments: true,
				collapseWhitespace: true,
			},
			favicon: './src/icons/favicon.ico',
		}),
		new MiniCssExtractPlugin({
			filename: 'style-[contenthash].min.css',
		}),
		new CleanWebpackPlugin(),
	],
};
