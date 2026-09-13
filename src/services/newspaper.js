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

function wrapText(ctx, text, maxWidth) {
    const words =
        String(text).split(/\s+/);

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
            ctx.measureText(text).width <=
            maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    return size;
}

function splitTextIntoChunks(
    ctx,
    text,
    width,
    maxHeight,
    lineHeight
) {
    const words =
        String(text)
            .split(/\s+/)
            .filter(Boolean);

    const chunks = [];

    let current = '';
    let currentHeight = 0;

    for (const word of words) {
        const test =
            current
                ? `${current} ${word}`
                : word;

        const testLines =
            wrapText(
                ctx,
                test,
                width
            );

        const testHeight =
            testLines.length *
            lineHeight;

        if (
            testHeight > maxHeight &&
            current
        ) {
            chunks.push(current);

            current = word;

            currentHeight =
                lineHeight;
        } else {
            current = test;

            currentHeight =
                testHeight;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function drawColumnText(
    ctx,
    text,
    x,
    y,
    width,
    bottom,
    lineHeight
) {
    const lines =
        wrapText(
            ctx,
            text,
            width
        );

    let index = 0;

    while (
        index < lines.length &&
        y <= bottom
    ) {
        ctx.fillText(
            lines[index],
            x,
            y
        );

        y += lineHeight;
        index++;
    }

    return {
        y,
        remaining:
            lines
                .slice(index)
                .join(' ')
    };
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
            30
        );

    ctx.font =
        `bold ${headlineSize}px Georgia`;

    ctx.textAlign =
        'left';

    const headlineEnd =
        drawText(
            ctx,
            headline,
            margin,
            390,
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

    ctx.font =
        '18px Merriweather, Georgia';

    const firstTextEnd =
        drawText(
            ctx,
            firstParagraph,
            margin,
            headlineEnd + 75,
            590,
            29,
            10
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

    const firstSectionEnd =
        Math.max(
            mainImageY +
                mainImageHeight,
            firstTextEnd
        );

    const firstDividerY =
        firstSectionEnd + 45;

    drawRule(
        ctx,
        margin,
        firstDividerY,
        width - margin,
        2
    );

    const secondImageY =
        firstDividerY + 40;

    const secondImageWidth =
        570;

    const secondImageHeight =
        390;

    drawImageCover(
        ctx,
        image2,
        margin,
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
        'The latest developments from Gotham City.';

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
            4
        );

    ctx.font =
        'bold 19px Georgia';

    ctx.fillText(
        date,
        secondTextX,
        secondTitleEnd + 10
    );

    const remainingParagraphs =
        paragraphs
            .slice(2)
            .join(' ');

    const secondBody =
        remainingParagraphs ||
        firstParagraph ||
        news.subtitle ||
        'More details continue to emerge as the story develops.';

    ctx.font =
        '18px Merriweather, Georgia';

    const secondBodyEnd =
        drawText(
            ctx,
            secondBody,
            secondTextX,
            secondTitleEnd + 55,
            secondTextWidth,
            29,
            11
        );

    const secondSectionEnd =
        Math.max(
            secondImageY +
                secondImageHeight,
            secondBodyEnd
        );

    const secondDividerY =
        secondSectionEnd + 45;

    drawRule(
        ctx,
        margin,
        secondDividerY,
        width - margin,
        2
    );

    const bottomTop =
        secondDividerY + 45;

    const footerLineY =
        height - 125;

    const bottomHeight =
        footerLineY -
        bottomTop -
        35;

    const columnGap =
        45;

    const columnWidth =
        (
            contentWidth -
            columnGap * 2
        ) / 3;

    const columnX = [
        margin,
        margin +
            columnWidth +
            columnGap,
        margin +
            (columnWidth +
                columnGap) * 2
    ];

    const bottomTitleY =
        bottomTop + 5;

    const columnTextY =
        bottomTop + 65;

    const titles = [
        'CITY WATCH',
        'THE LATEST',
        'GAZETTE REPORT'
    ];

    const sourceText =
        [
            firstParagraph,
            paragraphs
                .slice(1)
                .join(' '),
            `Reported by ${news.author || 'Gotham Gazette Staff'}.`
        ]
            .filter(Boolean)
            .join(' ');

    ctx.font =
        'bold 31px Georgia';

    ctx.textAlign =
        'left';

    for (let i = 0; i < 3; i++) {
        ctx.fillText(
            titles[i],
            columnX[i],
            bottomTitleY
        );
    }

    ctx.font =
        '17px Merriweather, Georgia';

    let remaining =
        sourceText;

    for (let i = 0; i < 3; i++) {
        const result =
            drawColumnText(
                ctx,
                remaining,
                columnX[i],
                columnTextY,
                columnWidth,
                bottomTop +
                    bottomHeight,
                27
            );

        remaining =
            result.remaining;
    }

    if (remaining) {
        ctx.font =
            'italic 16px Georgia';

        ctx.fillText(
            'Continued in the next edition.',
            columnX[2],
            footerLineY - 20
        );
    }

    drawRule(
        ctx,
        margin,
        footerLineY,
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
