import {
    createCanvas,
    registerFont,
    loadImage
} from 'canvas';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(
    __dirname,
    '../fonts/Merriweather-Regular.ttf'
);

if (fs.existsSync(fontPath)) {
    registerFont(fontPath, {
        family: 'Merriweather'
    });
}

async function loadRemoteImage(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to download image: ${response.status}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    return loadImage(buffer);
}

function wrapText(
    ctx,
    text,
    maxWidth
) {
    const words =
        String(text)
            .split(/\s+/);

    const lines = [];

    let line = '';

    for (const word of words) {
        const testLine =
            line
                ? `${line} ${word}`
                : word;

        if (
            ctx.measureText(testLine).width >
                maxWidth &&
            line
        ) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }

    if (line) {
        lines.push(line);
    }

    return lines;
}

function drawText(
    ctx,
    text,
    x,
    y,
    width,
    lineHeight,
    maxLines = Infinity
) {
    const lines =
        wrapText(
            ctx,
            text,
            width
        );

    const visibleLines =
        lines.slice(
            0,
            maxLines
        );

    for (const line of visibleLines) {
        ctx.fillText(
            line,
            x,
            y
        );

        y += lineHeight;
    }

    return y;
}

function drawImageCover(
    ctx,
    image,
    x,
    y,
    width,
    height
) {
    const scale =
        Math.max(
            width / image.width,
            height / image.height
        );

    const drawWidth =
        image.width * scale;

    const drawHeight =
        image.height * scale;

    const drawX =
        x +
        (width - drawWidth) / 2;

    const drawY =
        y +
        (height - drawHeight) / 2;

    ctx.save();

    ctx.beginPath();

    ctx.rect(
        x,
        y,
        width,
        height
    );

    ctx.clip();

    ctx.drawImage(
        image,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    ctx.restore();
}

function drawRule(
    ctx,
    x1,
    y,
    x2,
    lineWidth = 2
) {
    ctx.lineWidth =
        lineWidth;

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y
    );

    ctx.lineTo(
        x2,
        y
    );

    ctx.stroke();
}

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize
) {
    let size =
        startSize;

    while (
        size > minSize
    ) {
        ctx.font =
            `bold ${size}px Georgia`;

        if (
            ctx.measureText(
                text
            ).width <=
            maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    return size;
}

export async function generateNewspaper(
    news,
    image1Url,
    image2Url
) {
    const width = 1600;
    const height = 2200;

    const canvas =
        createCanvas(
            width,
            height
        );

    const ctx =
        canvas.getContext('2d');

    const image1 =
        await loadRemoteImage(
            image1Url
        );

    const image2 =
        await loadRemoteImage(
            image2Url
        );

    ctx.fillStyle =
        '#ffffff';

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    ctx.fillStyle =
        '#111111';

    ctx.strokeStyle =
        '#222222';

    ctx.textBaseline =
        'alphabetic';

    const margin = 90;
    const contentWidth =
        width -
        margin * 2;

    const today =
        new Date();

    const date =
        today.toLocaleDateString(
            'en-US',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );

    ctx.font =
        '22px Georgia';

    ctx.textAlign =
        'left';

    ctx.fillText(
        `ISSUE, ${date.toUpperCase()}`,
        margin,
        105
    );

    ctx.textAlign =
        'right';

    ctx.fillText(
        String(
            news.category ||
            'NEWS'
        ).toUpperCase(),
        width - margin,
        105
    );

    drawRule(
        ctx,
        margin,
        125,
        width - margin,
        2
    );

    ctx.textAlign =
        'center';

    ctx.font =
        'bold 108px Georgia';

    ctx.fillText(
        'GOTHAM GAZETTE',
        width / 2,
        250
    );

    drawRule(
        ctx,
        margin,
        290,
        width - margin,
        2
    );

    const headline =
        news.headline ||
        'BREAKING NEWS FROM GOTHAM CITY';

    const headlineSize =
        fitText(
            ctx,
            headline,
            590,
            48,
            32
        );

    ctx.font =
        `bold ${headlineSize}px Georgia`;

    ctx.textAlign =
        'left';

    const headlineY =
        405;

    const headlineEnd =
        drawText(
            ctx,
            headline,
            margin,
            headlineY,
            590,
            headlineSize * 1.18,
            4
        );

    ctx.font =
        'bold 20px Georgia';

    ctx.fillText(
        date,
        margin,
        headlineEnd + 25
    );

    ctx.font =
        '18px Merriweather, Georgia';

    const body =
        news.body ||
        'No article content was provided.';

    const paragraphs =
        String(body)
            .split(/\n+/)
            .map(
                paragraph =>
                    paragraph.trim()
            )
            .filter(Boolean);

    const firstParagraph =
        paragraphs[0] ||
        body;

    drawText(
        ctx,
        firstParagraph,
        margin,
        headlineEnd + 75,
        590,
        29,
        9
    );

    const mainImageX =
        740;

    const mainImageY =
        350;

    const mainImageWidth =
        770;

    const mainImageHeight =
        500;

    drawImageCover(
        ctx,
        image1,
        mainImageX,
        mainImageY,
        mainImageWidth,
        mainImageHeight
    );

    drawRule(
        ctx,
        margin,
        900,
        width - margin,
        2
    );

    const secondImageX =
        margin;

    const secondImageY =
        940;

    const secondImageWidth =
        570;

    const secondImageHeight =
        390;

    drawImageCover(
        ctx,
        image2,
        secondImageX,
        secondImageY,
        secondImageWidth,
        secondImageHeight
    );

    const secondTextX =
        720;

    const secondTextWidth =
        790;

    const secondTitle =
        paragraphs[1] ||
        news.subtitle ||
        'Developing story in Gotham City.';

    ctx.font =
        'bold 40px Georgia';

    ctx.textAlign =
        'left';

    const secondTitleEnd =
        drawText(
            ctx,
            secondTitle,
            secondTextX,
            secondImageY + 60,
            secondTextWidth,
            47,
            3
        );

    ctx.font =
        'bold 19px Georgia';

    ctx.fillText(
        date,
        secondTextX,
        secondTitleEnd + 10
    );

    const secondBody =
        paragraphs
            .slice(2)
            .join(' ') ||
        news.subtitle ||
        'More details continue to emerge as the story develops.';

    ctx.font =
        '18px Merriweather, Georgia';

    drawText(
        ctx,
        secondBody,
        secondTextX,
        secondTitleEnd + 55,
        secondTextWidth,
        29,
        8
    );

    drawRule(
        ctx,
        margin,
        1380,
        width - margin,
        2
    );

    const columnGap =
        45;

    const columnWidth =
        (
            contentWidth -
            columnGap * 2
        ) / 3;

    const columnY =
        1445;

    const columnX = [
        margin,
        margin +
            columnWidth +
            columnGap,
        margin +
            (columnWidth +
                columnGap) * 2
    ];

    const blocks = [
        {
            title:
                'CITY WATCH',
            text:
                paragraphs[3] ||
                `Authorities in ${news.location || 'Gotham City'} continue to monitor the situation.`
        },
        {
            title:
                'THE LATEST',
            text:
                paragraphs[4] ||
                'Officials have not yet released additional information regarding the developing story.'
        },
        {
            title:
                'GAZETTE REPORT',
            text:
                `Reported by ${news.author || 'Gotham Gazette Staff'}. The Gazette will continue following the story.`
        }
    ];

    for (
        let i = 0;
        i < 3;
        i++
    ) {
        ctx.textAlign =
            'left';

        ctx.font =
            'bold 31px Georgia';

        ctx.fillText(
            blocks[i].title,
            columnX[i],
            columnY
        );

        ctx.font =
            '17px Merriweather, Georgia';

        drawText(
            ctx,
            blocks[i].text,
            columnX[i],
            columnY + 55,
            columnWidth,
            27,
            7
        );
    }

    drawRule(
        ctx,
        margin,
        height - 125,
        width - margin,
        2
    );

    ctx.textAlign =
        'center';

    ctx.font =
        '16px Georgia';

    ctx.fillText(
        'THE GOTHAM GAZETTE • GOTHAM CITY • EST. 1939',
        width / 2,
        height - 75
    );

    return canvas.toBuffer(
        'image/png'
    );
}
