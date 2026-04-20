import dynamo from "./dynamodb.js";
import s3client from "./s3.js";
import {ScanCommand, GetCommand} from "@aws-sdk/lib-dynamodb";
import {PAPERS_TABLE} from "../config/env.js";
import {GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const fetchPapers = async ({ topics = [], limit = 10 }) => {
  const safeLimit = Number(limit) || 10;

  const result = await dynamo.send(
    new ScanCommand({
      TableName: PAPERS_TABLE,
    })
  );

  let papers = result.Items || [];

  if (topics.length > 0) {
    papers = papers.filter((paper) =>
      paper.topics?.some((topic) => topics.includes(topic))
    );
  }

  papers.sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  return papers.slice(0, safeLimit);
};

export const fetchPaperById = async (paper_id) => {
  const result = await dynamo.send(
    new GetCommand({
      TableName: PAPERS_TABLE,
      Key: { paper_id },
    })
  )

  const paper = result.Item

  if (!paper) return null

  // If no audio, just return paper
  if (!paper.audioKey) return paper

  // Generate signed URL from S3
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: paper.audioKey,
  })

  const audioUrl = await getSignedUrl(s3client, command, {
    expiresIn: 3600,
  })

  return {
    ...paper,
    audioUrl,
  }
}