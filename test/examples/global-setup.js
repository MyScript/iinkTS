import dotenv from 'dotenv'

let pathToEnvFile = process.cwd() + `/.env`
if (process.env.TARGET) {
  pathToEnvFile += `.${process.env.TARGET}`
}
pathToEnvFile += `.local`

dotenv.config({
  path: pathToEnvFile,
})

/**
 * With E2E_STACK=docker, starts the backend, the examples and the browsers in docker and points
 * the tests at them; the returned function is the teardown. Workers read the environment set here:
 * they start after it. docker/e2e-stack.mjs is internal, left out of the public snapshot: imported
 * only when asked for.
 */
export default async function globalSetup(config) {
  //https://github.com/microsoft/playwright/issues/41351
  process.env.PLAYWRIGHT_TRACING_NO_WEBSOCKET_FRAMES=1

  const stack = process.env.E2E_STACK === 'docker'
    ? await (await import('../../docker/e2e-stack.mjs')).startStack()
    : undefined
  Object.assign(process.env, stack?.env)

  for (const project of config.projects) {
    if (!project.use) {
      project.use = {}
    }
    if (process.env.BASE_URL) {
      project.use.baseURL = process.env.BASE_URL
    }
  }

  console.log('BASE_URL', process.env.BASE_URL)
  console.log('PATH_PREFIX', process.env.PATH_PREFIX)
  console.log('SCHEME', process.env.SCHEME)
  console.log('HOST', process.env.HOST)
  console.log('HMAC_KEY', process.env.HMAC_KEY)
  console.log('APPLICATION_KEY', process.env.APPLICATION_KEY)

  console.log(config.projects.map(p => ({name: p.__projectId, viewport: p.use.viewport })))
  console.log('Global setup completed.')
  return stack?.stop
}
