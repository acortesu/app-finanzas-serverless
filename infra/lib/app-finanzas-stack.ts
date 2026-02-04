import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  SecretValue,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

/**
 * Props extendidas para manejar entornos (dev / prod)
 */
export type AppFinanzasStackProps = StackProps & {
  stage: string;
};

export class AppFinanzasStack extends Stack {
  constructor(scope: Construct, id: string, props: AppFinanzasStackProps) {
    super(scope, id, props);

    const { stage } = props;

    const userPool = new cognito.UserPool(this, "FinanzasUserPool", {
      userPoolName: `finanzas-users-${stage}`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
    });

    const googleClientId = new secretsmanager.Secret(this, "GoogleClientId", {
      secretStringValue: SecretValue.unsafePlainText(
        process.env.GOOGLE_CLIENT_ID!,
      ),
    });

    const googleClientSecret = new secretsmanager.Secret(
      this,
      "GoogleClientSecret",
      {
        secretStringValue: SecretValue.unsafePlainText(
          process.env.GOOGLE_CLIENT_SECRET!,
        ),
      },
    );

    const googleIdp = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleIdP",
      {
        userPool,
        clientId: googleClientId.secretValue.unsafeUnwrap(),
        clientSecret: googleClientSecret.secretValue.unsafeUnwrap(),
        scopes: ["profile", "email"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        },
      },
    );

    userPool.registerIdentityProvider(googleIdp);

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "FinanzasAppClient",
      {
        userPool,
        generateSecret: false,
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.GOOGLE,
        ],
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: true,
          },
        },
      },
    );

    userPoolClient.node.addDependency(googleIdp);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "FinanzasAuthorizer",
      {
        cognitoUserPools: [userPool],
        authorizerName: "FinanzasCognitoAuthorizer",
        identitySource: "method.request.header.Authorization",
      },
    );

    /*
     * DynamoDB – Single Table
     */
    const table = new dynamodb.Table(this, "FinanzasTable", {
      tableName: `app-finanzas-${stage}`,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    /*
     * Lambdas existentes
     */
    const createExpenseLambda = new NodejsFunction(
      this,
      "CreateExpenseLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/expenses/createExpense/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    const getExpensesLambda = new NodejsFunction(this, "GetExpensesLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "../../services/expenses/getExpenses/handler.ts",
      ),
      handler: "main",
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    const getExpenseLambda = new NodejsFunction(this, "GetExpenseLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "../../services/expenses/getExpense/handler.ts",
      ),
      handler: "main",
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    /*
     * 🔹 NUEVO: Lambda UPDATE expense
     */
    const updateExpenseLambda = new NodejsFunction(
      this,
      "UpdateExpenseLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/expenses/updateExpense/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );
    /*
     * 🔹 NUEVO: Lambda DELETE expense
     */
    const deleteExpenseLambda = new NodejsFunction(
      this,
      "DeleteExpenseLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/expenses/deleteExpense/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda RESTORE expense
     */
    const restoreExpenseLambda = new NodejsFunction(
      this,
      "RestoreExpenseLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/expenses/restoreExpense/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda CREATE category
     */
    const createCategoryLambda = new NodejsFunction(
      this,
      "CreateCategoryLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/categories/createCategory/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda GET categories
     */
    const getCategoriesLambda = new NodejsFunction(
      this,
      "GetCategoriesLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/categories/getCategories/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda GET category by id
     */
    const getCategoryLambda = new NodejsFunction(this, "GetCategoryLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "../../services/categories/getCategory/handler.ts",
      ),
      handler: "main",
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    /*
     * 🔹 NUEVO: Lambda UPDATE category
     */
    const updateCategoryLambda = new NodejsFunction(
      this,
      "UpdateCategoryLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/categories/updateCategory/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda DELETE category
     */

    const deleteCategoryLambda = new NodejsFunction(
      this,
      "DeleteCategoryLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/categories/deleteCategory/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
      },
    );

    /*
     * 🔹 NUEVO: Lambda RESTORE category
     */
    const restoreCategoryLambda = new NodejsFunction(
      this,
      "RestoreCategoryLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../services/categories/restoreCategory/handler.ts",
        ),
        handler: "main",
        memorySize: 256,
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: "node20",
        },
      },
    );

    /*
     * Permisos DynamoDB
     */
    table.grantReadData(getExpenseLambda);
    table.grantReadData(getExpensesLambda);
    table.grantReadWriteData(createExpenseLambda);
    table.grantReadWriteData(deleteExpenseLambda);
    table.grantReadWriteData(updateExpenseLambda);
    table.grantReadWriteData(createCategoryLambda);
    table.grantReadData(getCategoriesLambda);
    table.grantReadData(getCategoryLambda);
    table.grantReadWriteData(updateCategoryLambda);
    table.grantReadWriteData(deleteCategoryLambda);
    table.grantReadWriteData(restoreExpenseLambda);
    table.grantReadWriteData(restoreCategoryLambda);

    /*
     * API Gateway – REST API
     */
    const api = new apigateway.RestApi(this, "FinanzasApi", {
      restApiName: `Finanzas Service (${stage})`,
      deployOptions: {
        stageName: stage,
      },
    });

    const expenses = api.root.addResource("expenses");
    const expenseById = expenses.addResource("{expenseId}");

    expenses.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createExpenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    expenses.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getExpensesLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    expenseById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getExpenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    /*
     * 🔹 NUEVO: PUT /expenses/{expenseId}
     */
    expenseById.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateExpenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    /*
     * 🔹 NUEVO: DELETE /expenses/{expenseId}
     */
    expenseById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteExpenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    /*
     * 🔹 NUEVO: PUT /expenses/{expenseId}/restore
     */
    const expenseRestore = expenseById.addResource("restore");

    expenseRestore.addMethod(
      "POST",
      new apigateway.LambdaIntegration(restoreExpenseLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    const categories = api.root.addResource("categories");

    categories.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createCategoryLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );
    categories.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCategoriesLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    const categoryById = categories.addResource("{categoryId}");

    categoryById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCategoryLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    categoryById.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateCategoryLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    /*
     * 🔹 NUEVO: DELETE /category/{categoryId}
     */
    categoryById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteCategoryLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );

    const restoreCategory = categoryById.addResource("restore");

    restoreCategory.addMethod(
      "POST",
      new apigateway.LambdaIntegration(restoreCategoryLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: ["openid", "email", "profile"],
      },
    );
  }
}
