import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#22c55e" rx="96"/>
  <path d="M128 256 L210 338 L384 164" stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

async function generateIcons() {
  const svgBuffer = Buffer.from(svgContent);
  
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png');
  console.log('Created icon-192.png');
  
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png');
  console.log('Created icon-512.png');
  
  // Apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');
}

generateIcons().catch(console.error);

