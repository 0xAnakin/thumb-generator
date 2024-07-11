const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const INPUT_DIR = path.join(__dirname, '../in');
const OUTPUT_DIR = path.join(__dirname, '../out');
const LOGO = path.join(__dirname, '../in/cosmote-placeholder.jpg');
const BACKGROUND_COLOR = '#162633';

const isImage = (file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext);
};

const start = async (srcDir) => {

    const imagePaths = {};
    const logo = await sharp(LOGO);

    const processDirectory = async (dir, parentDir) => {

        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {

            if (file.isDirectory()) {

                const subDir = path.join(dir, file.name);

                await processDirectory(subDir, file.name);

            } else if (isImage(file.name)) {

                if (parentDir) {

                    if (!imagePaths[parentDir]) {
                        imagePaths[parentDir] = [];
                    }

                    if (parentDir in imagePaths) {

                        const fileIN = path.join(dir, file.name);
                        const dirOUT = path.join(OUTPUT_DIR, parentDir);
                        const fileOUT = path.join(dirOUT, file.name);

                        try {
                            await fs.access(dirOUT, fs.constants.F_OK);
                        } catch (err) {
                            await fs.mkdir(dirOUT, { recursive: false });
                        }

                        const base = await sharp(fileIN);
                        const base_metadata = await base.metadata();

                        const logo_w = Math.floor(base_metadata.width / 100 * 80);
                        const logo_h = Math.floor(base_metadata.height / 100 * 80);

                        await base.composite([
                            {
                                input: Buffer.from(`<svg width="${base_metadata.width}" height="${base_metadata.height}" viewbox="0 0 ${base_metadata.width} ${base_metadata.height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${base_metadata.width}" height="${base_metadata.height}" fill="${BACKGROUND_COLOR}"/></svg>`)
                            },
                            {
                                input: await logo.resize({ width: logo_w, height: logo_h }).jpeg({
                                    chromaSubsampling: '4:4:4',
                                    quality: 100
                                }).toBuffer(),
                                top: Math.round(base_metadata.height / 2 - logo_h / 2),
                                left: Math.round(base_metadata.width / 2 - logo_w / 2)
                            }
                        ]).jpeg({
                            chromaSubsampling: '4:4:4',
                            quality: 80
                        }).toFile(fileOUT);

                        imagePaths[parentDir].push(fileOUT);

                    }

                }

            }
        };

    };

    await processDirectory(srcDir, '');

    return imagePaths;

};


(async () => {

    try {
        await fs.access(INPUT_DIR, fs.constants.F_OK);
    } catch (err) {
        await fs.mkdir(INPUT_DIR, { recursive: false });
    }

    try {
        await fs.access(OUTPUT_DIR, fs.constants.F_OK);
    } catch (err) {
        await fs.mkdir(OUTPUT_DIR, { recursive: false });
    }    

    const result = await start(INPUT_DIR);

    console.log(result);

})()



