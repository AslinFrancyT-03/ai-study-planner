import fs from "fs/promises";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const KNOWLEDGE_DIR = path.resolve("./knowledge-base");

export class KnowledgeManager {
  static async ensureDir() {
    try {
      await fs.access(KNOWLEDGE_DIR);
    } catch {
      await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
    }
  }

  static async addText(label, content) {
    await this.ensureDir();
    const id = Date.now();
    const filePath = path.join(KNOWLEDGE_DIR, `text_${id}.json`);
    await fs.writeFile(filePath, JSON.stringify({ id, label, content, type: 'text' }));
  }

  static async addLink(url) {
    try {
      await this.ensureDir();
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      const content = $("body").text().replace(/\s+/g, " ").trim();
      const id = Date.now();
      const filePath = path.join(KNOWLEDGE_DIR, `link_${id}.json`);
      await fs.writeFile(filePath, JSON.stringify({ id, url, content: content.substring(0, 10000), type: 'link' }));
    } catch (error) {
      console.error("Link Extraction Failure:", error.message);
      throw error;
    }
  }

  static async addDocument(fileName, buffer) {
    try {
      await this.ensureDir();
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      const content = data.text.replace(/\s+/g, " ").trim();
      const id = Date.now();
      const filePath = path.join(KNOWLEDGE_DIR, `doc_${id}.json`);
      await fs.writeFile(filePath, JSON.stringify({ id, name: fileName, content: content.substring(0, 20000), type: 'doc' }));
    } catch (error) {
      console.error("Error parsing PDF:", error.message);
      throw error;
    }
  }

  static async findRelevantContext(query) {
    await this.ensureDir();
    const files = await fs.readdir(KNOWLEDGE_DIR);
    let bestMatch = null;
    let maxOverlap = 0;

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    if (queryTerms.length === 0) return null;

    for (const file of files) {
      const data = await fs.readFile(path.join(KNOWLEDGE_DIR, file), "utf-8");
      const entry = JSON.parse(data);
      const contentLower = entry.content.toLowerCase();
      
      let score = 0;
      queryTerms.forEach(term => {
        if (contentLower.includes(term)) score++;
      });

      if (score > maxOverlap) {
        maxOverlap = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && maxOverlap > 0) {
      return `[Source: ${bestMatch.label || bestMatch.name || bestMatch.url}]\n\n${bestMatch.content}`;
    }
    return null;
  }
}

