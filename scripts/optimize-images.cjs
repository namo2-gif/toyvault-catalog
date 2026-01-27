const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function optimizeImage(inputPath, outputPath) {
  const stats = await fs.stat(inputPath);
  const originalSize = (stats.size / 1024).toFixed(0);
  
  await sharp(inputPath)
    .resize(1200, 1200, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outputPath);
  
  const newStats = await fs.stat(outputPath);
  const newSize = (newStats.size / 1024).toFixed(0);
  const saved = Math.round(((stats.size - newStats.size) / stats.size) * 100);
  
  console.log(`✓ ${path.basename(inputPath)}: ${originalSize}KB → ${newSize}KB (${saved}% saved)`);
}

async function processImages() {
  const uploadsDir = path.join(__dirname, '../public/images/uploads');
  const productsDir = path.join(__dirname, '../public/images/products');
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(productsDir, { recursive: true });
    
    const files = await fs.readdir(uploadsDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    
    if (imageFiles.length === 0) {
      console.log('No images to optimize');
      return;
    }
    
    console.log(`Optimizing ${imageFiles.length} images...`);
    
    for (const file of imageFiles) {
      const input = path.join(uploadsDir, file);
      const outputName = file.replace(/\.(png|webp)$/i, '.jpg');
      const output = path.join(productsDir, outputName);
      
      await optimizeImage(input, output);
    }
    
    console.log('✅ All images optimized!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

async function cleanupOrphanedImages() {
  const productsDir = path.join(__dirname, '../public/images/products');
  const contentDir = path.join(__dirname, '../src/content/products');
  
  try {
    const imageFiles = await fs.readdir(productsDir);
    const mdFiles = await fs.readdir(contentDir);
    
    const referencedImages = new Set();
    for (const mdFile of mdFiles) {
      const content = await fs.readFile(path.join(contentDir, mdFile), 'utf-8');
      const match = content.match(/image:\s*["']?([^"'\n]+)["']?/);
      if (match) {
        referencedImages.add(path.basename(match[1]));
      }
    }
    
    for (const imageFile of imageFiles) {
      if (!referencedImages.has(imageFile)) {
        await fs.unlink(path.join(productsDir, imageFile));
        console.log(`🗑️  Deleted: ${imageFile}`);
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

processImages().then(() => cleanupOrphanedImages()).catch(console.error);