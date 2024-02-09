import axios from 'axios'
import { prettyParse } from '../utility'
export async function retrieveData(platform: string) {
  const req = await axios.get(
    `https://clientsettingscdn.roblox.com/v2/settings/application/${platform}`
  )
  const parsed = await prettyParse(JSON.stringify(req.data.applicationSettings))
  const Objs = Object.fromEntries(parsed)
  return JSON.stringify(Objs, null, 4)
}
