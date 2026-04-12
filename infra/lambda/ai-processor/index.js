import { connectToDatabase } from "../shared/db.js";
import Paper from "./models/paper.model.js";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({});
const polly = new PollyClient({});
const s3 = new S3Client({});

const generateAISummary = async (paper) => {
  const prompt = `Summarize this AI paper in 3-4 simple sentences:

Title: ${paper.title}
Topics: ${paper.topic.join(", ")}
Abstract: ${paper.summary}`;

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text.trim();
};

const generateAudio = async (text) => {
  const response = await polly.send(
    new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: "Joanna",
      Engine: "neural",
    })
  );

  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const uploadToS3 = async (buffer, paperId) => {
  const key = `audio/${paperId}.mp3`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "audio/mpeg",
    })
  );

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await connectToDatabase();

  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    const papers = await Paper.find({
      topic: message.topic,
      $or: [
        { audioUrl: { $exists: false } },
        { audioUrl: "" },
      ],
    }).limit(message.insertedCount || 10);

    for (const paper of papers) {
      const summary = await generateAISummary(paper);
      const audio = await generateAudio(summary);
      const audioUrl = await uploadToS3(audio, paper._id);

      await Paper.findByIdAndUpdate(paper._id, {
        summary,
        audioUrl,
      });
    }
  }

  return {};
};