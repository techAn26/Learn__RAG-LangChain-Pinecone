import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// 環境変数の確認
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!PINECONE_API_KEY || !PINECONE_INDEX || !OPENAI_API_KEY) {
  throw new Error("必要な環境変数が設定されていません");
}

// Pineconeクライアントの初期化
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

async function initVectorStore() {
  try {
    // チャンクデータの読み込み
    const chunksPath = path.join('./src/04_toPinecone/input', 'combined_chunks.json');
    const chunksData = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(chunksData);

    // OpenAI Embeddingsの初期化
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
    });

    // Pineconeのインデックスを取得
    const index = pinecone.Index(PINECONE_INDEX!);

    // VectorStoreの作成
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    // チャンクをVectorStoreに追加
    await vectorStore.addDocuments(
      chunks.map((chunk: any) => ({
        pageContent: chunk.content,
        metadata: chunk.metadata,
      }))
    );

    return vectorStore;
  } catch (error) {
    console.error('VectorStoreの初期化中にエラーが発生しました:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('VectorStoreを初期化中...');
    await initVectorStore();
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();