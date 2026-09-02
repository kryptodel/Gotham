import {
    createCanvas,
    registerFont
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

function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];

    let line = '';

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && line.length > 0) {
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

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = wrapText(ctx, text, maxWidth);

    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }

    return y;
}

function fitHeadline(ctx, text, maxWidth, startSize, minSize) {
    let size = startSize;

    while (size > minSize) {
        ctx.font = `bold ${size}px Georgia`;

        if (ctx.measureText(text).width <= maxWidth) {
            break;
        }

        size -= 2;
    }

    return size;
}

export async function generateNewspaper(news) {
    const width = 1600;
    const height = 2200;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f1ead8';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#191919';
    ctx.lineWidth = 6;
    ctx.strokeRect(45, 45, width - 90, height - 90);

    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    ctx.fillStyle = '#111111';

    ctx.textAlign = 'center';
    ctx.font = 'bold 92px Georgia';
    ctx.fillText('THE GOTHAM GAZETTE', width / 2, 160);

    ctx.textAlign = 'center';
    ctx.font = '24px Georgia';
    ctx.fillText('THE CITY NEVER SLEEPS', width / 2, 205);

    ctx.beginPath();
    ctx.moveTo(100, 235);
    ctx.lineTo(width - 100, 235);
    ctx.stroke();

    const today = new Date();
    const date = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    ctx.font = '20px Georgia';

    ctx.textAlign = 'left';
    ctx.fillText(date.toUpperCase(), 110, 275);

    ctx.textAlign = 'right';
    ctx.fillText('VOL. 01 — NO. 001', width - 110, 275);

    const category = String(news.category || 'GOTHAM NEWS').toUpperCase();

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(category, width / 2, 335);

    const headline = news.headline || 'BREAKING NEWS FROM GOTHAM CITY';

    ctx.textAlign = 'center';

    const headlineSize = fitHeadline(
        ctx,
        headline,
        1380,
        76,
        42
    );

    ctx.font = `bold ${headlineSize}px Georgia`;

    const headlineLines = wrapText(
        ctx,
        headline,
        1380
    );

    let headlineY = 430;

    for (const line of headlineLines) {
        ctx.textAlign = 'center';
        ctx.fillText(line, width / 2, headlineY);
        headlineY += headlineSize * 1.15;
    }

    const subtitle =
        news.subtitle ||
        'Details continue to emerge as authorities investigate the incident.';

    ctx.textAlign = 'center';
    ctx.font = 'italic 30px Georgia';

    const subtitleY = headlineY + 15;

    const subtitleEndY = drawWrappedText(
        ctx,
        subtitle,
        width / 2,
        subtitleY,
        1250,
        40
    );

    const location = news.location || 'GOTHAM CITY';

    ctx.fillStyle = '#171717';
    ctx.font = 'bold 22px Georgia';
    ctx.textAlign = 'left';

    ctx.fillText(
        String(location).toUpperCase(),
        120,
        subtitleEndY + 35
    );

    ctx.beginPath();
    ctx.moveTo(110, subtitleEndY + 60);
    ctx.lineTo(width - 110, subtitleEndY + 60);
    ctx.stroke();

    const columnWidth = 650;
    const leftX = 120;
    const rightX = 830;
    const bodyY = subtitleEndY + 110;

    ctx.fillStyle = '#171717';
    ctx.font = '24px Merriweather, Georgia';

    const body =
        news.body ||
        'No article content was provided.';

    const paragraphs = String(body)
        .split(/\n+/)
        .map(p => p.trim())
        .filter(Boolean);

    let leftY = bodyY;
    let rightY = bodyY;
    let currentColumn = 'left';

    for (let i = 0; i < paragraphs.length; i++) {
        const lines = wrapText(
            ctx,
            paragraphs[i],
            columnWidth
        );

        if (currentColumn === 'left') {
            for (const line of lines) {
                if (leftY > height - 300) {
                    currentColumn = 'right';
                    break;
                }

                ctx.textAlign = 'left';
                ctx.fillText(
                    line,
                    leftX,
                    leftY
                );

                leftY += 36;
            }

            if (currentColumn === 'left') {
                leftY += 20;
            }
        }

        if (currentColumn === 'right') {
            for (const line of lines) {
                if (rightY > height - 300) {
                    break;
                }

                ctx.textAlign = 'left';
                ctx.fillText(
                    line,
                    rightX,
                    rightY
                );

                rightY += 36;
            }

            rightY += 20;
        }
    }

    const dividerEnd = Math.min(
        Math.max(leftY, rightY),
        height - 260
    );

    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(800, bodyY);
    ctx.lineTo(800, dividerEnd);
    ctx.stroke();

    const author =
        news.author ||
        'Gotham Gazette Staff';

    const authorY = Math.min(
        Math.max(leftY, rightY) + 35,
        height - 165
    );

    ctx.fillStyle = '#171717';
    ctx.font = 'italic 20px Georgia';
    ctx.textAlign = 'right';

    ctx.fillText(
        `Reported by ${author}`,
        width - 120,
        authorY
    );

    ctx.strokeStyle = '#191919';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(100, height - 135);
    ctx.lineTo(width - 100, height - 135);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = '18px Georgia';
    ctx.textAlign = 'center';

    ctx.fillText(
        'THE GOTHAM GAZETTE • GOTHAM CITY • EST. 1939',
        width / 2,
        height - 85
    );

    return canvas.toBuffer('image/png');
    }
