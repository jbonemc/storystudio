import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
  AlignmentType,
} from "docx";
import { AppState } from "./types";

// Story Studio brand colours (hex without #)
const DARK_BLUE = "1F4E79";
const ACCENT_BLUE = "2E75B6";
const MID_GREY = "555555";
const LIGHT_GREY = "999999";
const RULE_GREY = "DDDDDD";

// PIP role labels and accent colours
const PIP_LABELS = ["Problem", "Inspiration", "Payoff"];
const PIP_COLORS = ["C0392B", "B7770D", "1E8449"]; // red / amber / green

// ── Helpers ────────────────────────────────────────────────────────────────

function gap(halfPts = 240): Paragraph {
  return new Paragraph({
    spacing: { before: halfPts, after: 0 },
    children: [],
  });
}

function rule(color = RULE_GREY): Paragraph {
  return new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 4, color } },
    spacing: { before: 0, after: 0 },
    children: [],
  });
}

function label(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 16,
        color: ACCENT_BLUE,
        font: "Arial",
        allCaps: true,
      }),
    ],
  });
}

function body(text: string, opts?: { italic?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: "Arial",
        italics: opts?.italic,
        color: opts?.color,
      }),
    ],
  });
}

// ── Main export function ────────────────────────────────────────────────────

export async function generateDocxExport(state: AppState): Promise<void> {
  const shouldStatement =
    state.customShouldStatement || state.selectedShouldStatement;

  const children: Paragraph[] = [];

  // ── Title block ──────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: "Story Studio",
          bold: true,
          size: 40,
          color: DARK_BLUE,
          font: "Arial",
        }),
        new TextRun({
          text: " — Content Tool",
          size: 40,
          color: ACCENT_BLUE,
          font: "Arial",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: "storystudiocourse.com",
          size: 18,
          color: LIGHT_GREY,
          italics: true,
          font: "Arial",
        }),
      ],
    })
  );
  children.push(gap(80));
  children.push(rule(ACCENT_BLUE));
  children.push(gap(240));

  // ── Behaviour Change ─────────────────────────────────────────────────────
  children.push(label("Behaviour Change"));
  children.push(body(state.behaviourChange));
  children.push(gap(240));

  // ── Should Statement ─────────────────────────────────────────────────────
  children.push(label("Should Statement"));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: `\u201C${shouldStatement}\u201D`,
          size: 24,
          italics: true,
          bold: true,
          color: DARK_BLUE,
          font: "Arial",
        }),
      ],
    })
  );
  children.push(gap(320));

  // ── Three Messages ───────────────────────────────────────────────────────
  state.selectedMessages.forEach((msg, i) => {
    const pipLabel = PIP_LABELS[i] ?? `Message ${i + 1}`;
    const pipColor = PIP_COLORS[i] ?? DARK_BLUE;
    const msgData = state.messages[i];

    children.push(rule());
    children.push(gap(200));

    // Message number + PIP role header
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 100 },
        children: [
          new TextRun({
            text: `Message ${i + 1} — `,
            bold: true,
            size: 22,
            color: MID_GREY,
            font: "Arial",
          }),
          new TextRun({
            text: pipLabel,
            bold: true,
            size: 22,
            color: pipColor,
            font: "Arial",
          }),
        ],
      })
    );

    // The message itself
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: msg,
            bold: true,
            size: 28,
            color: DARK_BLUE,
            font: "Arial",
          }),
        ],
      })
    );
    children.push(gap(280));

    // Story
    if (msgData.story?.trim()) {
      children.push(label("Story"));
      children.push(body(msgData.story));
      children.push(gap(200));
    }

    // Statistic
    if (msgData.statistic?.trim()) {
      children.push(label("Statistic"));
      children.push(body(msgData.statistic));
      children.push(gap(200));
    }

    // Soundbite
    if (msgData.soundbite?.trim()) {
      children.push(label("Soundbite"));
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({
              text: `\u201C${msgData.soundbite}\u201D`,
              size: 22,
              italics: true,
              color: DARK_BLUE,
              font: "Arial",
            }),
          ],
        })
      );
      children.push(gap(200));
    }
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  children.push(rule(ACCENT_BLUE));
  children.push(gap(120));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: "Behaviour Change + Should Statement + 3 Messages \u00d7 3 Proofs = Your 13-Item Master Plan",
          bold: true,
          size: 18,
          color: DARK_BLUE,
          font: "Arial",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: "Generated by Story Studio Content Tool \u00b7 storystudiocourse.com",
          size: 16,
          color: LIGHT_GREY,
          italics: true,
          font: "Arial",
        }),
      ],
    })
  );

  // ── Build and download ───────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content-tool-plan.docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
