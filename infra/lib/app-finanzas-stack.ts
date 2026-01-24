import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'path'

/**
 * Props extendidas para manejar entornos (dev / prod)
 */
export type AppFinanzasStackProps = StackProps & {
  stage: string
}

export class AppFinanzasStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AppFinanzasStackProps
  ) {
    super(scope, id, props)

    const { stage } = props

    /*
     * DynamoDB – Single Table
     */
    const table = new dynamodb.Table(this, 'FinanzasTable', {
      tableName: `app-finanzas-${stage}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        stage === 'prod'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY
    })

    /*
     * Lambda – createExpense
     * TypeScript → esbuild (Node 20)
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

    const getExpensesLambda = new NodejsFunction(
      this,
      'GetExpensesLambda',
    {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '../../services/expenses/getExpenses/handler.ts'
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

    // Permisos DynamoDB
    table.grantReadData(getExpensesLambda)

    // Permisos mínimos
    table.grantReadWriteData(createExpenseLambda)

    /*
     * API Gateway – REST API
     */
    const api = new apigateway.RestApi(this, 'FinanzasApi', {
      restApiName: `Finanzas Service (${stage})`,
      deployOptions: {
        stageName: stage
      }
    })

    const expenses = api.root.addResource('expenses')

    expenses.addMethod(
  'POST',
  new apigateway.LambdaIntegration(createExpenseLambda)
)

    expenses.addMethod(
  'GET',
  new apigateway.LambdaIntegration(getExpensesLambda)
)
  }
}