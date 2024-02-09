import { octokit } from '..'
export async function createBlob(content: string) {
  const { data } = await octokit.request(
    'POST /repos/{owner}/{repo}/git/blobs',
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME,
      content: content,
      encoding: 'base64',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  return data.sha
}
