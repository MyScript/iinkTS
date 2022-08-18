import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import config from './rollup.config'

config[0].plugins.push(
  serve({
    open: true,
    openPage: '/examples/index.html',
    verbose: true,
    contentBase: '',
    host: 'localhost',
    port: 10001,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }),
  livereload({
    watch: [
      'dist',
      'examples'
    ]
  })
)

config.watch = {
  include: 'src/**'
}

export default config
