import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { GeneratePostParams, PostVariant } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const LENGTH_GUIDE: Record<string, string> = {
  SHORT:  'Entre 50 et 150 mots. Accroche percutante, direct au but.',
  MEDIUM: 'Entre 150 et 300 mots. Introduction + développement + CTA.',
  LONG:   'Entre 300 et 500 mots. Storytelling complet avec émotion.',
};

const TONE_GUIDE: Record<string, string> = {
  PROFESSIONAL: 'Formel, crédible, expertise affichée. Vocabulaire professionnel.',
  SELLER:       'Urgence, bénéfices concrets, CTA fort. Chiffres si possible.',
  MOTIVATION:   'Inspirant, émotionnel, citations percutantes, appel à l\'action positif.',
  FUNNY:        'Humour léger approprié, jeux de mots, décontracté mais professionnel.',
  EDUCATIONAL:  'Informatif, valeur ajoutée, conseils pratiques, pédagogique.',
};

const OBJECTIVE_GUIDE: Record<string, string> = {
  AWARENESS:   'Faire connaître la marque. Pas de vente directe.',
  ENGAGEMENT:  'Susciter des réactions, commentaires, partages.',
  CONVERSION:  'Pousser à acheter / contacter / s\'inscrire.',
  TRAFFIC:     'Diriger vers le site web ou le magasin.',
};

function buildFullPrompt(
  profile: {
    businessName?: string | null;
    activity?: string | null;
    slogan?: string | null;
    mainTheme?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    hashtags: string[];
    language: string;
  },
  params: GeneratePostParams
): string {
  const tone = params.tone.toUpperCase();
  const length = params.length.toUpperCase();
  const objective = params.objective.toUpperCase();
  const count = params.variantsCount || 1;

  return `Tu es un expert en marketing digital et rédaction de contenu Facebook pour des entreprises africaines et francophones.

ENTREPRISE :
- Nom : ${profile.businessName || 'Mon Entreprise'}
- Activité : ${profile.activity || 'Non précisée'}
- Slogan : "${profile.slogan || ''}"
- Thème principal : ${profile.mainTheme || 'Général'}

INFORMATIONS DE CONTACT À INTÉGRER NATURELLEMENT :
${profile.phone ? `- Téléphone : ${profile.phone}` : ''}
${profile.whatsapp ? `- WhatsApp : ${profile.whatsapp}` : ''}
${profile.email ? `- Email : ${profile.email}` : ''}
${profile.address ? `- Adresse : ${profile.address}` : ''}

HASHTAGS OBLIGATOIRES : ${profile.hashtags.length > 0 ? profile.hashtags.join(' ') : '#business'}

RÈGLES IMPÉRATIVES :
1. Écrire en ${profile.language === 'fr' ? 'français' : profile.language} uniquement
2. Intégrer les infos de contact naturellement à la fin
3. Toujours terminer avec les hashtags
4. Style naturel et authentique, jamais robotique
5. Contenu adapté aux valeurs culturelles locales
6. Jamais de contenu trompeur, spam ou offensant
7. Éviter les majuscules excessives et les points d'exclamation répétés

---

Génère ${count} variante(s) de publication Facebook.

THÈME : ${params.theme}
OBJECTIF MARKETING : ${OBJECTIVE_GUIDE[objective] || objective}
TON : ${TONE_GUIDE[tone] || tone}
LONGUEUR : ${LENGTH_GUIDE[length] || length}
${params.customInstructions ? `INSTRUCTIONS SPÉCIALES : ${params.customInstructions}` : ''}

IMPORTANT : Retourne UNIQUEMENT un objet JSON valide, sans markdown ni explication.
Format exact :
{
  "variants": [
    {
      "text": "contenu complet du post prêt à publier",
      "hook": "première phrase d'accroche",
      "cta": "appel à l'action principal utilisé"
    }
  ]
}`;
}

export async function generatePost(
  params: GeneratePostParams,
  userId: string
): Promise<PostVariant[]> {
  const page = await prisma.facebookPage.findUnique({
    where: { id: params.pageId },
    include: { businessProfile: true },
  });

  if (!page || page.userId !== userId) throw new Error('Page introuvable');
  const profile = page.businessProfile;
  if (!profile) throw new Error('Profil business non configuré');

  const prompt = buildFullPrompt(profile, params);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    // cast needed: thinkingConfig not yet in SDK typedefs for v0.24
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    } as never,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: { variants: PostVariant[] };
  try {
    // Extract JSON even if thinking text is prepended/appended
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('no json');
    parsed = JSON.parse(text.substring(start, end + 1));
    if (!Array.isArray(parsed.variants)) throw new Error('no variants');
  } catch {
    throw new Error('Format de réponse IA invalide');
  }

  await prisma.aiGeneration.create({
    data: {
      userId,
      pageId: params.pageId,
      prompt,
      result: parsed as never,
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: 0,
      costUsd: 0,
    },
  });

  return parsed.variants;
}
