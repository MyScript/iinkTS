import dotenv from 'dotenv'

console.log(' process.cwd(): ',  process.cwd());
dotenv.config({
  path: process.cwd() + '/.env.local',
})

export default async function globalSetup() {
  console.log('SCHEME', process.env.SCHEME)
  console.log('HOST', process.env.HOST)
  console.log('HMAC_KEY', process.env.HMAC_KEY)
  console.log('APPLICATION_KEY', process.env.APPLICATION_KEY)
  console.log('Global setup completed.')
}
