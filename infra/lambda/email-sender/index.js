import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({});

export const handler = async (event) => {
  const results = [];

  for (const record of event.Records) {
    const { email, papers, subscribedTopics } = JSON.parse(record.body);

    try {
      const paperList = papers
        .map(
          (p, i) =>
            `${i + 1}. ${p.title}\n` +
            `   Topics: ${p.topic.join(", ")}\n` +
            `   ${p.summary.slice(0, 200)}...\n` +
            `   PDF: ${p.pdfUrl || "Not available"}\n`
        )
        .join("\n");

      const textBody =
        `Hi there!\n\nHere are the latest AI research papers matching your topics ` +
        `(${subscribedTopics.join(", ")}):\n\n${paperList}\n---\nAIKnowledgeHub`;

      const htmlBody =
        `<h2>Your AI Research Update</h2>` +
        `<p>Topics: <strong>${subscribedTopics.join(", ")}</strong></p><hr/>` +
        papers
          .map(
            (p) =>
              `<div style="margin-bottom:20px;">` +
              `<h3>${p.title}</h3>` +
              `<p><em>${p.topic.join(", ")}</em></p>` +
              `<p>${p.summary.slice(0, 300)}...</p>` +
              (p.pdfUrl ? `<a href="${p.pdfUrl}">Read PDF</a>` : "") +
              `</div>`
          )
          .join("") +
        `<hr/><p style="color:#888;">AIKnowledgeHub</p>`;

      await ses.send(
        new SendEmailCommand({
          Source: process.env.SES_SENDER_EMAIL,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: {
              Data: `AIKnowledgeHub: ${papers.length} new papers in ${subscribedTopics.join(", ")}`,
              Charset: "UTF-8",
            },
            Body: {
              Text: { Data: textBody, Charset: "UTF-8" },
              Html: { Data: htmlBody, Charset: "UTF-8" },
            },
          },
        })
      );

      results.push({ email, status: "sent" });
    } catch (error) {
      console.error(`Failed ${email}:`, error.message);
      results.push({ email, status: "failed" });
    }
  }

  return {
    batchItemFailures: event.Records
      .filter((_, i) => results[i]?.status === "failed")
      .map((r) => ({ itemIdentifier: r.messageId })),
  };
};