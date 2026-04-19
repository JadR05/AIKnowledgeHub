import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AWS_REGION } from "../config/env.js";

const client = new DynamoDBClient({
  region: AWS_REGION,
});

const dynamo = DynamoDBDocumentClient.from(client);

export default dynamo;