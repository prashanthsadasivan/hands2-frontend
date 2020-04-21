const options = {
  devServer: {
    disableHostCheck: true,
  },
};

//if(process.env.NODE_ENV === 'production') {
//  options.publicPath = `${process.cwd()}/dist/`;
//}
module.exports = options;
