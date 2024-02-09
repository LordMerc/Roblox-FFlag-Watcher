import { config } from 'dotenv'
config()

import { Octokit } from '@octokit/core'
import axios from 'axios'
import { platforms, prettyParse, getFlagType } from './utility'

export const octokit = new Octokit({ auth: process.env.GIT_AUTH })
import { createBlob } from './functions/blobHandler'
import { retrieveData } from './functions/robloxFlagsHandler'
import { createTree } from './functions/treeHandler'
import dayjs from 'dayjs'
import {
  SubmitAdditionData,
  SubmitChangesData,
  SubmitDeletionData,
  submitAdditions,
  submitChanges,
  submitDeletions
} from './functions/webhookHandler'

const realNumber = parseInt(process.env.INTERVAL_CHECK)
const INTERVAL_CHECK = realNumber * 60000
const findMapDifferences = (
  oldMap: Map<string, any>,
  newMap: Map<string, any>
) => {
  const added = new Map<string, any>()
  const removed = new Map<string, any>()
  const changed = new Map<string, { oldValue: any; newValue: any }>()

  // Check for added or changed items in newMap
  newMap.forEach((value, key) => {
    if (!oldMap.has(key)) {
      added.set(key, value)
    } else if (oldMap.get(key) !== value) {
      changed.set(key, { oldValue: oldMap.get(key), newValue: value })
    }
  })

  // Check for removed items from oldMap
  oldMap.forEach((value, key) => {
    if (!newMap.has(key)) {
      removed.set(key, value)
    }
  })

  return { added, removed, changed }
}

async function testDifferences(platformName: string): Promise<any> {
  let repoFile: any = undefined
  try {
    repoFile = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: `${platformName}.json`,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
  } catch {
    //file is missing, probably deleted on accident?
    const grabRoblox = await axios.get(
      `https://clientsettingscdn.roblox.com/v2/settings/application/${platformName}`
    )
    const parsed = await prettyParse(
      JSON.stringify(grabRoblox.data.applicationSettings)
    )
    const Objs = Object.fromEntries(parsed)
    //console.log(parsed)
    const buffered = Buffer.from(JSON.stringify(Objs, null, 4)).toString(
      'base64'
    )
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      path: `${platformName}.json`,
      message: `Added ${platformName}.json`,
      content: `${buffered}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    repoFile = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        path: `${platformName}.json`,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    console.log(`Added back file ${platformName}.json`)
  }
  const testing = Buffer.from(repoFile.data?.content, 'base64').toString()
  const jsonTesting = JSON.parse(testing)
  const newMap = new Map<string, any>()
  for (const key in jsonTesting) {
    newMap.set(key, jsonTesting[key])
  }
  const grabRoblox = await axios.get(
    `https://clientsettingscdn.roblox.com/v2/settings/application/${platformName}`
  )
  const parsed = await prettyParse(
    JSON.stringify(grabRoblox.data.applicationSettings)
  )
  const differences = findMapDifferences(newMap, parsed)

  if (differences.added.size > 0) {
    for (const [key, value] of differences.added) {
      if (typeof value == 'boolean') {
        // variable is a boolean
        const { type, newName }: any = await getFlagType(key)
        const info: SubmitAdditionData = {
          flagType: type,
          key: newName,
          value: value.toString()
        }
        await submitAdditions(info)
      } else {
        if (typeof value === 'string') {
          if (value.length < 100) {
            const { type, newName }: any = await getFlagType(key)
            const info: SubmitAdditionData = {
              flagType: type,
              key: newName,
              value: value
            }
            await submitAdditions(info)
          }
        } else {
          const { type, newName }: any = await getFlagType(key)
          const info: SubmitAdditionData = {
            flagType: type,
            key: newName,
            value: value
          }
          await submitAdditions(info)
        }
      }
    }
  }

  if (differences.removed.size > 0) {
    for (const [key, change] of differences.removed) {
      const { type, newName }: any = await getFlagType(key)
      const info: SubmitDeletionData = {
        flagType: type,
        key: newName
      }
      await submitDeletions(info)
    }
  }

  if (differences.changed.size > 0) {
    for (const [key, change] of differences.changed) {
      //console.log(`${key}: ${change.oldValue} -> ${change.newValue}`)
      if (typeof change.newValue == 'boolean') {
        // variable is a boolean
        const { type, newName }: any = await getFlagType(key)
        const info: SubmitChangesData = {
          flagType: type,
          key: newName,
          changeData: {
            oldValue: change.oldValue.toString(),
            newValue: change.newValue.toString()
          }
        }
        await submitChanges(info)
      } else {
        if (typeof change.newValue === 'string') {
          if (change.newValue.length < 200) {
            const { type, newName }: any = await getFlagType(key)
            const info: SubmitChangesData = {
              flagType: type,
              key: newName,
              changeData: change
            }
            await submitChanges(info)
          } else {
            const { type, newName }: any = await getFlagType(key)
            const info: SubmitChangesData = {
              flagType: type,
              key: newName,
              changeData: {
                oldValue: '[String too large]',
                newValue: '[String too large]'
              }
            }
          }
        }
      }
    }
  }
  const data = { differences: differences, newData: parsed }
  return data
}

async function initalizeRepo() {
  const initialCommit = await octokit.request(
    'PUT /repos/{owner}/{repo}/contents/{path}',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      path: 'dummy.md',
      message: 'Initalize repo',
      content: 'bXkgbmV3IGZpbGUgY29udGVudHM=',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  const blobs = new Map()
  console.log('Creating blobs for inital setup..')
  for (const platform of platforms) {
    const parsedData = await retrieveData(platform)
    const buffered = Buffer.from(parsedData).toString('base64')
    const blobCreated = await createBlob(buffered)
    console.log(`blob for ${platform} created`)
    blobs.set(platform, blobCreated)
  }
  console.log('created blobs', blobs.entries())
  const tree = await createTree(blobs, undefined)
  console.log('created tree')
  const createCommit = await octokit.request(
    'POST /repos/{owner}/{repo}/git/commits',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      message: 'Initalize repo',
      parents: [`${initialCommit.data.commit.sha}`],
      tree: tree.data.sha,
      signature:
        '-----BEGIN PGP SIGNATURE-----\n\niQIzBAABAQAdFiEESn/54jMNIrGSE6Tp6cQjvhfv7nAFAlnT71cACgkQ6cQjvhfv\n7nCWwA//XVqBKWO0zF+bZl6pggvky3Oc2j1pNFuRWZ29LXpNuD5WUGXGG209B0hI\nDkmcGk19ZKUTnEUJV2Xd0R7AW01S/YSub7OYcgBkI7qUE13FVHN5ln1KvH2all2n\n2+JCV1HcJLEoTjqIFZSSu/sMdhkLQ9/NsmMAzpf/iIM0nQOyU4YRex9eD1bYj6nA\nOQPIDdAuaTQj1gFPHYLzM4zJnCqGdRlg0sOM/zC5apBNzIwlgREatOYQSCfCKV7k\nnrU34X8b9BzQaUx48Qa+Dmfn5KQ8dl27RNeWAqlkuWyv3pUauH9UeYW+KyuJeMkU\n+NyHgAsWFaCFl23kCHThbLStMZOYEnGagrd0hnm1TPS4GJkV4wfYMwnI4KuSlHKB\njHl3Js9vNzEUQipQJbgCgTiWvRJoK3ENwBTMVkKHaqT4x9U4Jk/XZB6Q8MA09ezJ\n3QgiTjTAGcum9E9QiJqMYdWQPWkaBIRRz5cET6HPB48YNXAAUsfmuYsGrnVLYbG+\nUpC6I97VybYHTy2O9XSGoaLeMI9CsFn38ycAxxbWagk5mhclNTP5mezIq6wKSwmr\nX11FW3n1J23fWZn5HJMBsRnUCgzqzX3871IqLYHqRJ/bpZ4h20RhTyPj5c/z7QXp\neSakNQMfbbMcljkha+ZMuVQX1K9aRlVqbmv3ZMWh+OijLYVU2bc=\n=5Io4\n-----END PGP SIGNATURE-----\n',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  console.log('created commit')
  const update = await octokit.request(
    'PATCH /repos/{owner}/{repo}/git/refs/{ref}',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      ref: 'heads/main',
      sha: createCommit.data.sha,
      force: true,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  console.log(`Repo has been successfully initialized!`)
}

async function init() {
  // first check if repo given is empty, or has no previous commits
  const lastCommit = await octokit.request(
    'GET /repos/{owner}/{repo}/git/matching-refs/{ref}',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      ref: 'heads/main',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  const updates = new Map()
  for (const platform of platforms) {
    const data = await testDifferences(platform)
    const differences = data.differences
    const newData = data.newData
    if (
      differences.added.size > 0 ||
      differences.changed.size > 0 ||
      differences.removed.size > 0
    ) {
      console.log(`Updates for ${platform}`)
      updates.set(platform, newData)
    } else {
      console.log(`No updates for ${platform}`)
    }
  }
  if (updates.size > 0) {
    console.log('updateees')
    // need to submit updates
    const updateBlobs = new Map()
    for (const [platform, newData] of updates) {
      //console.log(platform, newData)
      const Objs = Object.fromEntries(newData)
      const buffered = Buffer.from(JSON.stringify(Objs, null, 4)).toString(
        'base64'
      )
      const blobCreated = await createBlob(buffered)
      console.log(`blob for ${platform} created`)
      updateBlobs.set(platform, blobCreated)
    }
    const tree = await createTree(updateBlobs, 'heads/main')
    console.log('created tree')
    const createCommit = await octokit.request(
      'POST /repos/{owner}/{repo}/git/commits',
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        message: `${dayjs().format('MM/DD/YYYY [at] HH:mm a')}`,
        parents: [`${lastCommit.data[0].object.sha}`],
        tree: tree.data.sha,
        signature:
          '-----BEGIN PGP SIGNATURE-----\n\niQIzBAABAQAdFiEESn/54jMNIrGSE6Tp6cQjvhfv7nAFAlnT71cACgkQ6cQjvhfv\n7nCWwA//XVqBKWO0zF+bZl6pggvky3Oc2j1pNFuRWZ29LXpNuD5WUGXGG209B0hI\nDkmcGk19ZKUTnEUJV2Xd0R7AW01S/YSub7OYcgBkI7qUE13FVHN5ln1KvH2all2n\n2+JCV1HcJLEoTjqIFZSSu/sMdhkLQ9/NsmMAzpf/iIM0nQOyU4YRex9eD1bYj6nA\nOQPIDdAuaTQj1gFPHYLzM4zJnCqGdRlg0sOM/zC5apBNzIwlgREatOYQSCfCKV7k\nnrU34X8b9BzQaUx48Qa+Dmfn5KQ8dl27RNeWAqlkuWyv3pUauH9UeYW+KyuJeMkU\n+NyHgAsWFaCFl23kCHThbLStMZOYEnGagrd0hnm1TPS4GJkV4wfYMwnI4KuSlHKB\njHl3Js9vNzEUQipQJbgCgTiWvRJoK3ENwBTMVkKHaqT4x9U4Jk/XZB6Q8MA09ezJ\n3QgiTjTAGcum9E9QiJqMYdWQPWkaBIRRz5cET6HPB48YNXAAUsfmuYsGrnVLYbG+\nUpC6I97VybYHTy2O9XSGoaLeMI9CsFn38ycAxxbWagk5mhclNTP5mezIq6wKSwmr\nX11FW3n1J23fWZn5HJMBsRnUCgzqzX3871IqLYHqRJ/bpZ4h20RhTyPj5c/z7QXp\neSakNQMfbbMcljkha+ZMuVQX1K9aRlVqbmv3ZMWh+OijLYVU2bc=\n=5Io4\n-----END PGP SIGNATURE-----\n',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    console.log('created commit')
    const update = await octokit.request(
      'PATCH /repos/{owner}/{repo}/git/refs/{ref}',
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO_NAME,
        ref: 'heads/main',
        sha: createCommit.data.sha,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    console.log(update.data)
  }
  setInterval(init, INTERVAL_CHECK)
}

initalizeRepo()
//init()
