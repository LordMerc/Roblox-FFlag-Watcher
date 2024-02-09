import { octokit } from '..'
export async function createTree(data: any, existingTree: string | undefined) {
  const dataToPush = new Array()
  const entries = data.entries()
  data.forEach((value: string, key: string) => {
    let info = {
      path: `${key}.json`,
      mode: '100644',
      type: 'blob',
      sha: value
    }
    dataToPush.push(info)
  })
  const tree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    tree: dataToPush,
    base_tree: existingTree ? existingTree : undefined,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  return tree
}
