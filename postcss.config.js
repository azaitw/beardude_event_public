var autoprefixer = require('autoprefixer')

module.exports = {
  plugins: [
    autoprefixer({
      remove: false,
      browsers: [
        'last 2 versions',
        'IE >= 9',
        'safari >= 8'
      ]
    })
  ]
}
