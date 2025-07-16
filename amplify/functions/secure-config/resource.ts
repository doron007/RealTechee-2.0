import { defineFunction } from '@aws-amplify/backend';

export const secureConfig = defineFunction({
  name: 'secure-config',
  entry: './src/index.ts',
  environment: {
    // Grant access to Parameter Store
    AWS_REGION: 'us-west-1'
  },
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 256
});

// Grant permissions to read from Parameter Store
export const grantParameterStoreAccess = (backend: any) => {
  backend.secureConfig.resources.lambda.addToRolePolicy(
    new backend.aws_iam.PolicyStatement({
      effect: backend.aws_iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [
        `arn:aws:ssm:us-west-1:*:parameter/realtechee/*`
      ]
    })
  );
};