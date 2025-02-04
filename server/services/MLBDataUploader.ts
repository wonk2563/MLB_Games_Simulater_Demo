import fs from 'fs-extra'
import * as readline from 'node:readline';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import PQueue from 'p-queue';


interface ProgressCallback {
    (progress: {
      currentGame?: number
      totalGames?: number
      status?: string
      error?: number
    }): void
}

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004", // 768 dimensions
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "BaseBallGames",
});
const pinecone = new PineconeClient({
    apiKey: useRuntimeConfig().pineconeApiKey,
});
let pineconeIndex: any, vectorStore: any
const queue = new PQueue({concurrency: 100});

class MLBDataUploader {
    // 創建索引
    async createIndex() {
        await pinecone.createIndex({
            name: useRuntimeConfig().pineconeIndex,
            dimension: 768, // 根據您的嵌入向量維度進行調整
            metric: "cosine",
            spec: { 
                serverless: { 
                cloud: 'aws', 
                region: 'us-east-1' 
                }
            }
        });
        
        pineconeIndex = pinecone.Index(useRuntimeConfig().pineconeIndex);
    }

    // 創建向量存儲
    async createVectorStore() {
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex,
        });
    }

    async initVectorStore(onProgress?: ProgressCallback) {
        console.log("Initializing vector store...");
        
        await this.createIndex();
        await this.createVectorStore();
        
        const totalLines = await this.countFileLines('./datasets/processed_data/rag_data.jsonl');
        let current = 0;
        let errorCount = 0;

        queue.on('next', () => {
            ++current;
    
            onProgress?.({
                currentGame: current,
                totalGames: totalLines,
                status: 'uploading',
                error: errorCount
            });
        });

        queue.on('error', error => {
            ++errorCount;
            console.error(error);

            onProgress?.({
                status: 'error',
                currentGame: current,
                totalGames: totalLines,
                error: errorCount
            });
        });

        queue.on('idle', () => {
            console.log('Completed');

            onProgress?.({
                currentGame: current,
                totalGames: totalLines,
                status: 'completed',
                error: errorCount
            });
        });
      
        try {
            const rl = readline.createInterface({
                input: fs.createReadStream('./datasets/processed_data/rag_data.jsonl'),
                crlfDelay: Infinity
            });
        
            for await (const line of rl) {
                queue.add(async () => {
                    console.log(`Uploading line ${current}...`);
                    await vectorStore.addDocuments([JSON.parse(line)]);
                })
            }

        } catch (error: any) {
          console.log(error.message);
        }
    }

    async countFileLines(filePath: string) {
        let lineCount = 0;
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
      
        for await (const line of rl) {
          lineCount++;
        }
      
        return lineCount;
    }
}

export default MLBDataUploader