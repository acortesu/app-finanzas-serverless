import { App } from 'aws-cdk-lib'
import { AppFinanzasStack } from '../lib/app-finanzas-stack'

const app = new App()

const stage = app.node.tryGetContext('stage') || 'dev'

new AppFinanzasStack(app, `AppFinanzasStack-${stage}`, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
})