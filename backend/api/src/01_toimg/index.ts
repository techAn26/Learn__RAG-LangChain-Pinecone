import { PDFDocument } from 'pdf-lib';
import { fromPath } from 'pdf2pic';
import fs from 'fs/promises';

async function convertPDFToPNGs(pdfPath: string, outputDir: string) {
  // 出力ディレクトリが存在しない場合は作成
  await fs.mkdir(outputDir, { recursive: true });

  const options = {
    density: 300,           // DPI解像度
    saveFilename: "page",   // 出力ファイルのプレフィックス
    savePath: outputDir,    // 出力先ディレクトリ
    format: "png",          // 出力フォーマット
    width: 2480,           // 出力画像の幅
    height: 3508           // 出力画像の高さ（A4サイズを想定）
  };

  const convert = fromPath(pdfPath, options);

  // PDFファイルを読み込んでページ数を取得
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  // 各ページを画像に変換
  for (let i = 1; i <= pageCount; i++) {
    await convert(i);
    console.log(`ページ ${i} を変換しました`);
  }
}

// 使用例
async function main() {
  try {
    await convertPDFToPNGs('../docs/SampleDoc.pdf', './src/01_toimg/output');
    console.log('変換が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();