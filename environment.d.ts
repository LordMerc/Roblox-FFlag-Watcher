declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GIT_AUTH: string
      REPO_OWNER: string
      REPO_NAME: string
      INTERVAL_CHECK: string
      WEBHOOK_ID: string
      WEBHOOK_TOKEN: string
    }
  }
}
export {}
