// services/scraper.service.js

import { XMLParser } from "fast-xml-parser";
import Paper from "../models/paper.model.js";

// This object maps arXiv category codes to our app's topic names.
// We'll loop over these to scrape each category separately.
const CATEGORY_MAP = {
  "cs.CL": "NLP",
  "cs.CV": "Computer Vision",
  "cs.LG": "Reinforcement Learning",
};

// How many papers to fetch per category per run.
const MAX_RESULTS = 10;

// XMLParser is a class from fast-xml-parser.
// We configure it once here and reuse it.
// ignoreAttributes: false → we need XML attributes (like the pdf link's "href")
const parser = new XMLParser({ ignoreAttributes: false });

export const runScraper = async () => {
  // We'll collect a summary of what happened to return at the end.
  const results = [];

  // Loop over each arXiv category we want to scrape.
  for (const [arxivCategory, topicName] of Object.entries(CATEGORY_MAP)) {
    
    const url = `https://export.arxiv.org/api/query?search_query=cat:${arxivCategory}&sortBy=submittedDate&sortOrder=descending&max_results=${MAX_RESULTS}`;

    // fetch() is built into modern Node.js (v18+). It makes HTTP requests.
    // We await it because it's asynchronous — it takes time to get a response.
    const response = await fetch(url);
    const xmlText = await response.text(); // Read the response body as a string

    // Parse the XML string into a JavaScript object
    const parsed = parser.parse(xmlText);

    // The arXiv feed wraps entries under parsed.feed.entry
    // If there's only 1 result, arXiv returns an object, not an array.
    // We normalize it to always be an array with [].concat(...)
    const entries = [].concat(parsed?.feed?.entry ?? []);

    // Shape each arXiv entry into what our Paper model expects
    const papers = entries.map((entry) => {
      // The arXiv ID comes from the <id> tag, which is a full URL like:
      // "http://arxiv.org/abs/2401.12345v1"
      // We only want the last part: "2401.12345v1"
      const fullId = entry.id ?? "";
      const externalId = fullId.split("/abs/")[1] ?? fullId;

      // Find the PDF link — arXiv entries have multiple <link> tags.
      // The PDF one has type="application/pdf"
      // After parsing, links come as an array of objects with @_href, @_type
      const links = [].concat(entry.link ?? []);
      const pdfLink = links.find((l) => l["@_type"] === "application/pdf");
      const pdfUrl = pdfLink ? pdfLink["@_href"] : null;

      return {
        title: entry.title?.trim(),
        topic: [topicName],       // Our model expects an array of topics
        summary: entry.summary?.trim(),
        pdfUrl,
        source: "arXiv",
        externalId,
        publishedAt: entry.published ? new Date(entry.published) : null,
      };
    });

    // insertMany with ordered: false means:
    // → Insert all documents in one DB call
    // → If some already exist (duplicate externalId), skip them silently
    // → Don't stop inserting just because one failed
    let inserted = 0;
    try {
      const result = await Paper.insertMany(papers, { ordered: false });
      inserted = result.length;
    } catch (err) {
      // When ordered:false hits duplicates, it throws a BulkWriteError
      // but still inserts what it can. err.insertedDocs tells us what worked.
      if (err.name === "MongoBulkWriteError") {
        inserted = err.insertedDocs?.length ?? 0;
      } else {
        throw err; // Something unexpected — let it bubble up
      }
    }

    results.push({
      category: arxivCategory,
      topic: topicName,
      fetched: papers.length,
      inserted,
      skipped: papers.length - inserted,
    });
  }

  return results;
};