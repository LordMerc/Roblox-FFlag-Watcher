import { Octokit } from '@octokit/core'
import fs from 'node:fs'
import axios from 'axios'
const octokit = new Octokit({ auth: process.env.GIT_AUTH })
export const platforms = [
  'PCDesktopClient',
  'MacDesktopClient',
  'PCStudioBootstrapper',
  'MacStudioBootstrapper',
  'PCClientBootstrapper',
  'MacClientBootstrapper',
  'XboxClient',
  'AndroidApp',
  'iOSApp',
  'PCStudioApp',
  'MacStudioApp',
  'UWPApp'
]
export const baseURL =
  'https://clientsettingscdn.roblox.com/v2/settings/application/'

export interface parsedDataSchema {
  flag: string
  value: any
}

export async function getFlagType(flag: string) {
  if (flag.includes('DFFlag')) {
    const name = flag.replace('DFFlag', '')
    return { type: 'Dynamic Flag', newName: name }
  }
  if (flag.includes('DFInt')) {
    const name = flag.replace('DFInt', '')
    return { type: 'Dynamic Int', newName: name }
  }
  if (flag.includes('DFString')) {
    const name = flag.replace('DFString', '')
    return { type: 'Dynamic String', newName: name }
  }
  if (flag.includes('FInt')) {
    const name = flag.replace('FInt', '')
    return { type: 'Int', newName: name }
  }
  if (flag.includes('FFlag')) {
    const name = flag.replace('FFlag', '')
    return { type: 'Flag', newName: name }
  }
  if (flag.includes('FString')) {
    const name = flag.replace('FString', '')
    return { type: 'String', newName: name }
  }
  return { type: 'String', newName: flag }
}
export async function prettyParse(data: string) {
  const jsonData = JSON.parse(data)
  const parsedData = new Map<string, any>()

  for (const key in jsonData) {
    if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
      const value: any = jsonData[key]
      let replaced: any

      if (value === 'True') {
        replaced = true
      } else if (value === 'False') {
        replaced = false
      } else if (!isNaN(Number(value))) {
        replaced = Number(value)
      } else if (
        typeof value === 'string' &&
        (value.startsWith('True') || value.startsWith('False'))
      ) {
        replaced = value.substring(0, 1).toLowerCase() + value.substring(1)
      } else {
        replaced = value
      }

      parsedData.set(key, replaced)
    }
  }

  return parsedData
}
export interface FileData {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  _links: any // You may want to define a type for this as well
}
export async function getFiles() {
  const response: any = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  return response.data as FileData[]
}
