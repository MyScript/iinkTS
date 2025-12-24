import dotenv from 'dotenv'

let pathToEnvFile = process.cwd() + `/.env`
if (process.env.TARGET) {
  pathToEnvFile += `.${process.env.TARGET}`
}
pathToEnvFile += `.local`
console.log('pathToEnvFile: ', pathToEnvFile);

dotenv.config({
  path: pathToEnvFile,
})

export default async function globalSetup(config) {
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
  console.log('Global setup completed.')
}
