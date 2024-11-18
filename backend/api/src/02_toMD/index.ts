import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function convertImageToMarkdown(imagePath: string, outputDir: string): Promise<void> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この画像の内容をMarkdown形式で記述してください。見出し、箇条書き、表などの構造を適切に使用してください。"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    });

    const inputFileName = path.basename(imagePath, '.png');
    const outputFileName = `${inputFileName}.md`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.writeFile(outputPath, response.choices[0].message.content || '');
    console.log(`Markdownファイルが生成されました: ${outputPath}`);
  } catch (error) {
    console.error('画像の変換中にエラーが発生しました:', error);
    throw error;
  }
}

async function processAllImages(inputDir: string, outputDir: string) {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const files = await fs.readdir(inputDir);
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));

    const sortByPageNumber = (a: string, b: string) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    };

    pngFiles.sort(sortByPageNumber);

    for (const file of pngFiles) {
      console.log(`処理中: ${file}`);
      const imagePath = path.join(inputDir, file);
      await convertImageToMarkdown(imagePath, outputDir);
    }

  } catch (error) {
    console.error('処理中にエラーが発生しました:', error);
    throw error;
  }
}

async function main() {
  const inputDir = './src/02_toMD/input';
  const outputDir = './src/02_toMD/output';

  try {
    await processAllImages(inputDir, outputDir);
    console.log('すべての変換が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();
