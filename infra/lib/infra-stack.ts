import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'

export class AppFinanzasStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /*
     * DynamoDB
     */
    const table = new dynamodb.Table(this, 'FinanzasTable', {
      tableName: 'app-finanzas',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN
    })

    /*
     * Lambda – createExpense (TypeScript → esbuild)
     */
    const createExpenseLambda = new NodejsFunction(
      this,
      'CreateExpenseLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '../../services/expenses/createExpense/handler.ts'
        ),
        handler: 'main',
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20'
        }
      }
    )

    table.grantReadWriteData(createExpenseLambda)

    /*
     * API Gateway
     */
    const api = new apigateway.RestApi(this, 'FinanzasApi', {
      restApiName: 'Finanzas Service',
      deployOptions: { stageName: 'dev' }
    })

    const expenses = api.root.addResource('expenses')

    expenses.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createExpenseLambda),
      {
        authorizationType: apigateway.AuthorizationType.CUSTOM
      }
    )
  }
}