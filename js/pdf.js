// Gera o PDF com texto de verdade (selecionável), para que sistemas de triagem (ATS) consigam ler.
// As medidas aqui espelham as do .sheet em css/style.css.

const PAGE = { width: 210, height: 297, top: 14, bottom: 14, left: 16, right: 16 };
const CONTENT_WIDTH = PAGE.width - PAGE.left - PAGE.right;
const BODY_SIZE = 9.5;
const LINE_HEIGHT = 1.32;

const INK = [27, 31, 38];
const MUTED = [91, 98, 112];
const RULE = [185, 194, 207];

const ptToMm = (pt) => pt * 0.3528;

export function buildPdf(blocks, accent) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  let y = PAGE.top;
  let pages = 1;
  let previous = null;
  let name = '';

  const setFont = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const ensureSpace = (height) => {
    if (y + height > PAGE.height - PAGE.bottom) {
      doc.addPage();
      pages += 1;
      y = PAGE.top;
    }
  };

  const drawRule = () => {
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(PAGE.left, y, PAGE.width - PAGE.right, y);
  };

  function styleFor(run, context) {
    if (context === 'entry') {
      return run.italic ? { font: 'normal', color: MUTED } : { font: 'bold', color: INK };
    }
    const color = { muted: MUTED, accent }[context] ?? INK;
    let font = 'normal';
    if (run.bold && run.italic) font = 'bolditalic';
    else if (run.bold || context === 'name') font = 'bold';
    else if (run.italic) font = 'italic';
    return { font, color };
  }

  // Quebra de linha palavra por palavra, respeitando negrito/itálico no meio da frase.
  function wrap(runs, width, size, context) {
    const words = [];
    for (const run of runs) {
      const style = styleFor(run, context);
      for (const piece of run.text.split(/(\s+)/)) {
        if (piece) words.push({ text: /^\s+$/.test(piece) ? ' ' : piece, style });
      }
    }

    const lines = [];
    let line = [];
    let x = 0;
    const trimEnd = () => {
      while (line.length && line[line.length - 1].text === ' ') line.pop();
    };

    for (const word of words) {
      setFont(word.style.font, size, word.style.color);
      const wordWidth = doc.getTextWidth(word.text);

      if (word.text === ' ') {
        if (line.length) {
          line.push({ ...word, x });
          x += wordWidth;
        }
        continue;
      }
      if (x + wordWidth > width && line.length) {
        trimEnd();
        lines.push(line);
        line = [];
        x = 0;
      }
      line.push({ ...word, x });
      x += wordWidth;
    }
    trimEnd();
    if (line.length) lines.push(line);

    // Junta pedaços vizinhos com o mesmo estilo para gerar menos objetos de texto.
    return lines.map((segments) =>
      segments.reduce((merged, segment) => {
        const last = merged[merged.length - 1];
        if (last && last.style === segment.style) last.text += segment.text;
        else merged.push({ ...segment });
        return merged;
      }, []),
    );
  }

  function drawLines(lines, size, options = {}) {
    const {
      indent = 0,
      lineHeight = ptToMm(size) * LINE_HEIGHT,
      ascent = ptToMm(size) * 0.95,
      onFirstLine,
    } = options;

    lines.forEach((segments, index) => {
      ensureSpace(lineHeight);
      const baseline = y + ascent;
      if (index === 0 && onFirstLine) onFirstLine(baseline);
      for (const segment of segments) {
        setFont(segment.style.font, size, segment.style.color);
        doc.text(segment.text, PAGE.left + indent + segment.x, baseline);
      }
      y += lineHeight;
    });
  }

  const bodyLine = ptToMm(BODY_SIZE) * LINE_HEIGHT;

  for (const block of blocks) {
    switch (block.type) {
      case 'name':
        name ||= block.runs.map((run) => run.text).join('');
        drawLines(wrap(block.runs, CONTENT_WIDTH, 20, 'name'), 20, {
          lineHeight: ptToMm(20) * 1.15,
          ascent: ptToMm(20) * 0.8,
        });
        break;

      case 'title':
        y += 1.2;
        drawLines(wrap(block.runs, CONTENT_WIDTH, 11, 'accent'), 11);
        break;

      case 'contact':
        y += previous === 'contact' ? 0.4 : 1.2;
        drawLines(wrap(block.runs, CONTENT_WIDTH, 9, 'muted'), 9);
        break;

      case 'section':
        y += 4.2;
        ensureSpace(bodyLine * 3 + 2); // não deixa o título da seção sozinho no fim da página
        setFont('bold', BODY_SIZE, accent);
        doc.text(block.text.toUpperCase(), PAGE.left, y + ptToMm(BODY_SIZE) * 0.95, { charSpace: 0.25 });
        y += bodyLine + 0.2;
        drawRule();
        y += 1.6;
        break;

      case 'entry': {
        if (previous === 'section') y += 0.2;
        else if (previous === 'entry') y += 1.2;
        else y += 1.8;

        setFont('normal', BODY_SIZE, MUTED);
        const dateWidth = block.date ? doc.getTextWidth(block.date) + 4 : 0;
        const lines = wrap(block.runs, CONTENT_WIDTH - dateWidth, BODY_SIZE, 'entry');
        ensureSpace(bodyLine * (lines.length + 1));
        drawLines(lines, BODY_SIZE, {
          onFirstLine: (baseline) => {
            if (!block.date) return;
            setFont('normal', BODY_SIZE, MUTED);
            doc.text(block.date, PAGE.width - PAGE.right, baseline, { align: 'right' });
          },
        });
        break;
      }

      case 'item':
        if (previous === 'entry') y += 0.6;
        drawLines(wrap(block.runs, CONTENT_WIDTH - 4, BODY_SIZE, 'body'), BODY_SIZE, {
          indent: 4,
          onFirstLine: (baseline) => {
            setFont('normal', BODY_SIZE, INK);
            doc.text('•', PAGE.left + 1, baseline);
          },
        });
        break;

      case 'rule':
        y += 1.5;
        ensureSpace(2);
        drawRule();
        y += 1.5;
        break;

      default:
        if (block.spaced && previous && previous !== 'section') y += 1.2;
        drawLines(wrap(block.runs, CONTENT_WIDTH, BODY_SIZE, 'body'), BODY_SIZE);
    }
    previous = block.type;
  }

  doc.setProperties({ title: `${name || 'Currículo'} — CV`, author: name, subject: 'Currículo' });

  const usableHeight = PAGE.height - PAGE.top - PAGE.bottom;
  return { doc, pages, lastPageUsage: (y - PAGE.top) / usableHeight };
}
