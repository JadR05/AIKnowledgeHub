import dynamo from "./dynamo.js";
import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { PAPERS_TABLE } from "../config/env.js";

export const fetchPapers = async ({ topics = [], limit = 10 }) => {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: PAPERS_TABLE,
    })
  );

  let papers = result.Items || [];

  // filter by topics
  if (topics.length > 0) {
    papers = papers.filter((paper) =>
      paper.topics?.some((topic) => topics.includes(topic))
    );
  }

  // sort newest first
  papers.sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  return papers.slice(0, Number(limit));
};

export const fetchPaperById = async (paperId) => {
  const result = await dynamo.send(
    new GetCommand({
      TableName: PAPERS_TABLE,
      Key: {
        paperId,
      },
    })
  );

  return result.Item;
};