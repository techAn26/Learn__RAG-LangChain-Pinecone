import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';

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

interface SearchResult {
  content: string;
  metadata: {
    source: string;
    page: number;
    chunk: number;
  };
  score?: number;
}

async function searchDocs(
  query: string, 
  topK: number = 3
): Promise<SearchResult[]> {
  try {
    // OpenAI Embeddingsの初期化
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
    });

    // Pineconeのインデックスを取得
    const index = pinecone.Index(PINECONE_INDEX!);

    // VectorStoreの初期化
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    // 類似度検索を実行
    const results = await vectorStore.similaritySearch(query, topK);

    // 結果を整形
    return results.map(doc => ({
      content: doc.pageContent,
      metadata: doc.metadata as {
        source: string;
        page: number;
        chunk: number;
      },
    }));

  } catch (error) {
    console.error('検索中にエラーが発生しました:', error);
    throw error;
  }
}

// 使用例
async function main() {
  const queries = [
    "OGP画像の設定方法について教えて",
    "初期ページ作成の種類は？",
    "GoogleアナリティクスのIDはどこで設定しますか？"
  ];

  try {
    for (const query of queries) {
      console.log(`\n検索クエリ: "${query}"`);
      const results = await searchDocs(query);
      
      console.log('\n検索結果:');
      results.forEach((result, index) => {
        console.log(`\n[${index + 1}]`);
        console.log(`ページ: ${result.metadata.page}, チャンク: ${result.metadata.chunk}`);
        console.log(`内容:\n${result.content}`);
      });
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// エクスポート
export { searchDocs };

// テスト実行
if (require.main === module) {
  main();
}