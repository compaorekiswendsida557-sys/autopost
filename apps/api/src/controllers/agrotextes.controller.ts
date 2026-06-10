import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const AGRO_PAGE_ID = 'e857ce67-f5a3-4dec-a9f3-b2fa23673c87';

const BOLD: Record<string, string> = {
  'A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉',
  'K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓',
  'U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙',
  'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣',
  'k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭',
  'u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳',
  '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗',
};

function applyBold(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, (_: string, word: string) =>
    word.split('').map((c: string) => BOLD[c] ?? c).join('')
  );
}

async function ensureTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "GeneratedText" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      theme VARCHAR(500) NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export const generateTexts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { theme, count = 50 } = req.body;
    if (!theme?.trim()) { res.status(400).json({ error: 'Thème requis' }); return; }

    await ensureTable();

    const examples = await prisma.$queryRaw<{ content: string }[]>`
      SELECT content FROM "Post"
      WHERE "pageId" = ${AGRO_PAGE_ID} AND status = 'PUBLISHED'
      ORDER BY RANDOM() LIMIT 15
    `;

    const examplesText = examples.map((e: { content: string }, i: number) =>
      `--- Exemple ${i + 1} ---\n${e.content}`
    ).join('\n\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: `Tu es un expert en marketing digital pour l'agropastoral au Burkina Faso, travaillant pour "Agro-pastorale Tech".

Voici des exemples de publications réelles de cette page :

${examplesText}

CONSIGNE : Génère exactement ${count} textes de publications Facebook originaux pour le thème : "${theme}"

RÈGLES :
1. Mets les TITRES et MOTS IMPORTANTS entre **double astérisques**
2. Utilise des emojis variés comme dans les exemples
3. Inclus toujours à la fin : 📞 +226 52 49 39 23 / 06 56 06 31
4. Varie les accroches et structures
5. Adapte le ton à l'audience burkinabè

FORMAT : Retourne UNIQUEMENT un tableau JSON valide :
[{"text": "contenu 1"}, {"text": "contenu 2"}, ...]`,
      }],
    });

    const raw = (message.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Format invalide');

    const parsed: { text: string }[] = JSON.parse(jsonMatch[0]);

    const saved: unknown[] = [];
    for (const item of parsed) {
      const content = applyBold(item.text);
      const rows = await prisma.$queryRaw<{ id: string; content: string; theme: string; createdAt: Date }[]>`
        INSERT INTO "GeneratedText" (content, theme) VALUES (${content}, ${theme.trim()}) RETURNING *
      `;
      saved.push(rows[0]);
    }

    res.json({ texts: saved, count: saved.length });
  } catch (err) {
    console.error('agrotextes generate error:', err);
    res.status(500).json({ error: String(err) });
  }
};

export const getTexts = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureTable();
    const texts = await prisma.$queryRaw`SELECT * FROM "GeneratedText" ORDER BY "createdAt" DESC`;
    res.json({ texts });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

export const updateText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: 'Contenu requis' }); return; }
    const rows = await prisma.$queryRaw<unknown[]>`
      UPDATE "GeneratedText" SET content = ${content.trim()}, "updatedAt" = NOW()
      WHERE id = ${id}::uuid RETURNING *
    `;
    if (!Array.isArray(rows) || rows.length === 0) { res.status(404).json({ error: 'Non trouvé' }); return; }
    res.json({ text: rows[0] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

export const deleteText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw`DELETE FROM "GeneratedText" WHERE id = ${id}::uuid`;
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

export const deleteTexts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: 'IDs requis' }); return; }
    for (const id of ids) {
      await prisma.$executeRaw`DELETE FROM "GeneratedText" WHERE id = ${id}::uuid`;
    }
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
