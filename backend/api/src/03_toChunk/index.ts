import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from 'fs/promises';
import path from 'path';

interface ChunkMetadata {
  source: string;
  page: number;
  chunk: number;
}

async function splitMarkdownToChunks(inputDir: string, outputDir: string) {
  try {
    // 出力ディレクトリの作成
    await fs.mkdir(outputDir, { recursive: true });

    // MDファイルの取得
    const files = await fs.readdir(inputDir);
    const mdFiles = files.filter(file => file.toLowerCase().endsWith('.md'));

    // テキストスプリッターの設定
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 20,
      // 分割する箇所の優先順位
      separators: ["\n\n", "\n", " ", ""],
    });

    // 各MDファイルを処理
    for (const file of mdFiles) {
      console.log(`処理中: ${file}`);
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // ページ番号を抽出（例：page.1.md から 1を取得）
      const pageNumber = parseInt(file.match(/\d+/)?.[0] || '0');

      // テキストを分割
      const docs = await splitter.createDocuments(
        [content],
        [{ source: file, page: pageNumber }]
      );

      // 各チャンクをJSONとして保存
      const chunks = docs.map((doc, index) => ({
        content: doc.pageContent,
        metadata: {
          source: doc.metadata.source,
          page: doc.metadata.page,
          chunk: index + 1
        } as ChunkMetadata
      }));

      // チャンクをファイルに保存
      const outputPath = path.join(
        outputDir, 
        `${path.basename(file, '.md')}_chunks.json`
      );
      
      await fs.writeFile(
        outputPath,
        JSON.stringify(chunks, null, 2)
      );

      console.log(`チャンク化完了: ${outputPath}`);
    }

  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
    throw error;
  }
}

// メタデータを含むチャンクの型定義
interface Chunk {
  content: string;
  metadata: ChunkMetadata;
}

// チャンクの統合機能
async function combineChunks(outputDir: string) {
  try {
    const files = await fs.readdir(outputDir);
    const chunkFiles = files.filter(file => file.endsWith('_chunks.json'));

    let allChunks: Chunk[] = [];

    // 全てのチャンクファイルを読み込んで統合
    for (const file of chunkFiles) {
      const filePath = path.join(outputDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const chunks: Chunk[] = JSON.parse(content);
      allChunks = allChunks.concat(chunks);
    }

    // ページ番号とチャンク番号でソート
    allChunks.sort((a, b) => {
      if (a.metadata.page !== b.metadata.page) {
        return a.metadata.page - b.metadata.page;
      }
      return a.metadata.chunk - b.metadata.chunk;
    });

    // 統合されたチャンクを保存
    const combinedPath = path.join(outputDir, 'combined_chunks.json');
    await fs.writeFile(
      combinedPath,
      JSON.stringify(allChunks, null, 2)
    );

    console.log(`統合されたチャンクを保存しました: ${combinedPath}`);

  } catch (error) {
    console.error('チャンクの統合中にエラーが発生しました:', error);
    throw error;
  }
}

async function main() {
  const inputDir = './src/03_toChunk/input';    // MDファイルのディレクトリ
  const outputDir = './src/03_toChunk/output'; // 出力先ディレクトリ

  try {
    await splitMarkdownToChunks(inputDir, outputDir);
    await combineChunks(outputDir);
    console.log('すべての処理が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();