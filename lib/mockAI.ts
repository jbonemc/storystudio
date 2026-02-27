// ============================================================
// Context-aware mock AI — extracts real themes from document text
// and generates suggestions that reflect the user's actual work
// ============================================================

interface DocumentContext {
  geography: string;
  population: string;
  domain: string;
  domainShort: string;
  action: string;
  topKeywords: string[];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractDocumentContext(docs: string, extra: string = ''): DocumentContext {
  const text = (docs + ' ' + extra).toLowerCase();

  // --- Geographic context ---
  const geoMap: [string, string][] = [
    ['zimbabwe', 'Zimbabwe'], ['kenya', 'Kenya'], ['ghana', 'Ghana'], ['nigeria', 'Nigeria'],
    ['tanzania', 'Tanzania'], ['ethiopia', 'Ethiopia'], ['india', 'India'],
    ['bangladesh', 'Bangladesh'], ['pakistan', 'Pakistan'], ['myanmar', 'Myanmar'],
    ['cambodia', 'Cambodia'], ['vietnam', 'Vietnam'], ['indonesia', 'Indonesia'],
    ['philippines', 'the Philippines'], ['nepal', 'Nepal'], ['malawi', 'Malawi'],
    ['zambia', 'Zambia'], ['mozambique', 'Mozambique'], ['uganda', 'Uganda'],
    ['rwanda', 'Rwanda'], ['senegal', 'Senegal'], ['burkina faso', 'Burkina Faso'],
    ['sub-saharan', 'sub-Saharan Africa'], ['africa', 'Africa'],
    ['latin america', 'Latin America'], ['south asia', 'South Asia'],
    ['rural', 'rural communities'], ['remote', 'remote communities'],
    ['developing countr', 'developing countries'], ['low-income countr', 'low-income countries'],
    ['low-and-middle', 'low- and middle-income countries'], ['lmic', 'low- and middle-income countries'],
    ['global south', 'the Global South'],
  ];

  // --- Population context ---
  const popMap: [string, string][] = [
    ['smallholder', 'smallholder farmers'], ['women farmer', 'women farmers'],
    ['women', 'women'], ['female', 'women'], ['girl', 'girls and young women'],
    ['gender', 'women and girls'], ['farmer', 'smallholder farmers'],
    ['patient', 'patients'], ['children', 'children'], ['child', 'children'],
    ['youth', 'young people'], ['adolescent', 'adolescents'],
    ['refugee', 'refugees'], ['indigenous', 'Indigenous communities'],
    ['elderly', 'older people'], ['caregiver', 'caregivers'],
    ['nurse', 'frontline health workers'], ['community health', 'community health workers'],
    ['teacher', 'teachers and educators'], ['student', 'students'],
  ];

  // --- Domain context: [match, full description, short label] ---
  const domainMap: [string, string, string][] = [
    ['sorghum', 'sorghum and millet processing', 'cereal crop processing'],
    ['thresher', 'solar-powered threshing technology', 'agricultural mechanisation'],
    ['roaster', 'integrated threshing and roasting technology', 'grain processing'],
    ['mechanis', 'agricultural mechanisation', 'farm technology'],
    ['post-harvest', 'post-harvest technology', 'post-harvest solutions'],
    ['climate-smart', 'climate-smart agriculture', 'climate-smart farming'],
    ['food securit', 'food security', 'food security'],
    ['climate change', 'climate change adaptation', 'climate action'],
    ['solar', 'solar-powered technology', 'solar energy solutions'],
    ['renewable energy', 'renewable energy', 'clean energy'],
    ['carbon', 'carbon reduction technology', 'decarbonisation'],
    ['cancer', 'cancer treatment and care', 'cancer care'],
    ['mental health', 'mental health support', 'mental health'],
    ['vaccine', 'vaccination programmes', 'vaccines'],
    ['antibiotic', 'antimicrobial resistance', 'AMR'],
    ['diabetes', 'diabetes management', 'diabetes'],
    ['malaria', 'malaria prevention and treatment', 'malaria'],
    ['hiv', 'HIV/AIDS treatment and prevention', 'HIV'],
    ['tuberculosis', 'tuberculosis prevention and care', 'TB'],
    ['machine learning', 'AI and machine learning', 'AI technology'],
    ['artificial intelligence', 'artificial intelligence', 'AI'],
    ['digital health', 'digital health technology', 'digital health'],
    ['microbiome', 'microbiome research', 'the microbiome'],
    ['genomic', 'genomics research', 'genomics'],
    ['water', 'water access and sanitation', 'water security'],
    ['sanitation', 'water and sanitation', 'WASH'],
    ['housing', 'affordable housing', 'housing'],
    ['education', 'education innovation', 'education'],
    ['literacy', 'literacy programmes', 'literacy'],
  ];

  // --- Action context ---
  const actionMap: [string, string][] = [
    ['drudgery', 'free communities from backbreaking manual labour'],
    ['labour-intensive', 'replace labour-intensive methods with smarter solutions'],
    ['manual labour', 'replace manual labour with technology that works'],
    ['burden', 'reduce the burden on communities that have carried it too long'],
    ['empower', 'empower communities to determine their own futures'],
    ['transform', 'transform the lives of the people who need it most'],
    ['prevent', 'prevent harm before it takes hold'],
    ['increase access', 'increase access to the tools and support people deserve'],
    ['reduce', 'reduce the impact of this challenge on real lives'],
    ['improve', 'improve outcomes for the communities who need them most'],
    ['scale', 'scale what works so no community gets left behind'],
    ['sustain', 'build solutions that last beyond a single project'],
    ['gender equit', 'close the gender gap and give women a fair shot'],
    ['inequalit', 'tackle the inequalities that hold communities back'],
  ];

  let geography = '';
  let population = '';
  let domain = '';
  let domainShort = '';
  let action = '';

  for (const [term, value] of geoMap) {
    if (text.includes(term)) { geography = value; break; }
  }
  for (const [term, value] of popMap) {
    if (text.includes(term)) { population = value; break; }
  }
  for (const [term, full, short] of domainMap) {
    if (text.includes(term)) { domain = full; domainShort = short; break; }
  }
  for (const [term, value] of actionMap) {
    if (text.includes(term)) { action = value; break; }
  }

  // Extract top meaningful keywords
  const stopwords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
    'is','are','was','were','be','been','being','have','has','had','do','does','did',
    'will','would','could','should','may','might','that','this','these','those',
    'it','its','their','they','we','our','your','my','i','he','she','which','who',
    'what','when','where','how','why','as','so','if','than','then','more','most',
    'some','such','also','not','no','can','up','out','about','into','through','over',
    'after','before','between','during','each','all','both','few','many','much',
    'other','same','even','just','only','well','new','good','first','last','long',
    'own','right','great','high','used','using','based','project','study','research',
    'paper','results','data','analysis','model','system','approach','method','methods',
    'current','provide','include','including','however','therefore','although',
    'while','thus','hence','further','since','often','very','quite','been',
  ]);

  const wordFreq: Record<string, number> = {};
  for (const w of text.split(/\s+/)) {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length > 4 && !stopwords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  return { geography, population, domain, domainShort, action, topKeywords };
}

// ============================================================
// Public functions
// ============================================================

export function generateDocumentSummary(text: string): string {
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  if (words < 15) {
    return "Please paste more content so I can understand your project better. An abstract, summary, or description of your research or work would be ideal.";
  }
  const ctx = extractDocumentContext(text);
  const parts: string[] = [];
  if (ctx.domain) parts.push(ctx.domain);
  if (ctx.geography) parts.push(`in ${ctx.geography}`);
  if (ctx.population) parts.push(`affecting ${ctx.population}`);

  let summary = `I have read your document (${words} words).`;
  if (parts.length > 0) {
    summary += ` I can see this work centres on ${parts.join(', ')}.`;
  } else if (ctx.topKeywords.length > 0) {
    summary += ` Key themes I can see include: ${ctx.topKeywords.slice(0, 4).join(', ')}.`;
  } else {
    summary += ' I have identified the key themes and potential impact areas.';
  }
  summary += ' Let us use this as the foundation for building your communication plan.';
  return summary;
}

export function suggestBehaviourChanges(docs: string): string[] {
  const ctx = extractDocumentContext(docs);
  const { geography, population, domain, domainShort, topKeywords } = ctx;

  const lower = docs.toLowerCase();
  const p = population || 'communities affected by this issue';
  const g = geography ? ` in ${geography}` : '';
  const gOf = geography || 'this region';
  const d = domainShort || domain || 'this approach';
  const dFull = domain || 'this work';

  // Detect signals from document language
  const isPolicy    = lower.includes('policy') || lower.includes('government') || lower.includes('minister') || lower.includes('legislation') || lower.includes('strategy');
  const isFunder    = lower.includes('fund') || lower.includes('grant') || lower.includes('donor') || lower.includes('invest') || lower.includes('budget');
  const isAcademic  = lower.includes('journal') || lower.includes('publish') || lower.includes('peer review') || lower.includes('future research') || lower.includes('citation');
  const isPublic    = lower.includes('public') || lower.includes('citizen') || lower.includes('community') || lower.includes('school') || lower.includes('media') || lower.includes('outreach');
  const isSurvey    = lower.includes('survey') || lower.includes('volunteer') || lower.includes('participant') || lower.includes('citizen science') || lower.includes('trial');
  const isNGO       = lower.includes('ngo') || lower.includes('organisation') || lower.includes('organization') || lower.includes('programme') || lower.includes('implement');
  const keyTopic    = topKeywords[0] || d;

  const suggestions: string[] = [];

  // 1 — A concrete DECISION or formal commitment (funder / policymaker)
  suggestions.push(
    isPolicy && geography
      ? `Convince the ${gOf} government to formally include ${d} in its national development or agricultural strategy — moving from interest to a written commitment`
      : isFunder
        ? `Get a specific funder to approve a grant for the next phase of this work — not an expression of interest, but a signed commitment with a start date`
        : `Get the most important decision-maker in your audience to commit to a concrete next step — a funded pilot, a policy inclusion, or a formal review — rather than filing this away`
  );

  // 2 — A PRACTICE CHANGE on the ground (practitioners / implementers)
  suggestions.push(
    population && domain
      ? `Persuade practitioners who work with ${p}${g} to actively adopt ${d} — not as an experiment, but as their default approach`
      : isNGO
        ? `Convince a development organisation${g} to embed ${dFull} into their existing programme design rather than treating it as a one-off pilot`
        : `Move the people who deliver this kind of work from knowing about ${dFull} to actually using it — changing practice, not just perspective`
  );

  // 3 — A MINDSET SHIFT (any audience — reframes how they see the problem)
  suggestions.push(
    isPolicy
      ? `Shift policymakers from asking "is this proven?" to asking "what will it take to implement this at scale?" — from scepticism to ownership`
      : isAcademic
        ? `Convince peer researchers and research funders to treat ${keyTopic} as a priority area, not a peripheral interest — so it gets the attention and resource it deserves`
        : `Change how ${p || 'your audience'} thinks about this issue — from "this is too complex to solve" to "this is solvable and someone needs to act"`
  );

  // 4 — PARTICIPATION or direct engagement (public, volunteers, citizen science, surveys)
  suggestions.push(
    isSurvey
      ? `Recruit [X] volunteers or participants from ${p || 'the target community'}${g} to take part in the next phase of the study`
      : isPublic || geography
        ? `Get members of the public${g} — including schools, community groups, or local organisations — to actively engage with this issue: attend, share, or take part in a specific activity`
        : `Encourage your audience to take one direct action after your talk — sign up, share, respond to a survey, or join a citizen science project — so engagement becomes a habit, not a one-off`
  );

  // 5 — CHAMPIONING and amplification (peer networks, media, institutions)
  suggestions.push(
    isAcademic
      ? `Get three or more respected peers or institutions to publicly cite, recommend, or co-sign this work — lending it credibility in circles you cannot currently reach yourself`
      : isPublic
        ? `Inspire journalists, educators, or community leaders${g} to tell this story to their own audiences — multiplying your reach beyond the room you are standing in`
        : `Persuade a credible voice in your field — an institution, a network, or a respected individual — to publicly endorse and actively champion ${dFull} on your behalf`
  );

  return suggestions;
}

export function generateShouldStatements(docs: string, _behaviourChange: string): string[] {
  // Should statements are INJUSTICE CLAIMS — short, moral, quotable.
  // Pattern: "No [group] should [face this] — [qualifier]."
  // They name what is wrong with the world and imply that inaction is a moral failure.
  // They should be short enough to say right after your name.

  const ctx = extractDocumentContext(docs);
  const { geography, population, domain, domainShort } = ctx;

  const lower = docs.toLowerCase();
  const isGender = lower.includes('women') || lower.includes('gender') || lower.includes('female');
  const isTech = lower.includes('technology') || lower.includes('solar') || lower.includes('mechanis')
    || lower.includes('thresher') || lower.includes('digital') || lower.includes('innovation');
  const isHealth = lower.includes('patient') || lower.includes('disease') || lower.includes('cancer')
    || lower.includes('clinic') || lower.includes('treatment') || lower.includes('medical');

  // Singular form of population for "No [person] should..."
  const popSingular: Record<string, string> = {
    'smallholder farmers': 'smallholder farmer',
    'women farmers': 'woman farmer',
    'women': 'woman',
    'women and girls': 'woman or girl',
    'girls and young women': 'girl or young woman',
    'patients': 'patient',
    'children': 'child',
    'young people': 'young person',
    'adolescents': 'young person',
    'refugees': 'refugee',
    'older people': 'older person',
    'students': 'student',
    'teachers and educators': 'teacher',
    'frontline health workers': 'frontline health worker',
    'community health workers': 'community health worker',
    'Indigenous communities': 'Indigenous community',
  };

  const pop = population || 'the people this research is designed to help';
  const popSing = (population && popSingular[population]) || pop;
  const g = geography ? ` in ${geography}` : '';
  const gIn = geography ? `in ${geography}` : 'in communities like this';
  const d = domainShort || domain || 'this kind of work';
  const dFull = domain || 'the solutions this research makes possible';

  // Should statements name a broad human injustice — NOT the specific research, technology, or product.
  // Geography and population are fine. Mechanisms and solutions are not.
  // Think: "No child should go to school hungry" — not "No child should lack access to the FoodFirst programme."

  // 5 injustice-framed statements, each from a different angle
  const statements: string[] = [

    // 1 — "No [person] should [face this injustice]"
    population && geography
      ? `No ${popSing} ${gIn} should be held back by challenges that the rest of the world has already moved past.`
      : isHealth
        ? `No ${popSing} should face this without access to the best care available — wherever they happen to live.`
        : `No community should be left carrying the full weight of a problem that the rest of the world is not paying attention to.`,

    // 2 — "[Group] should [positive right]" — the equality framing
    isGender && geography
      ? `Women ${gIn} should not still be bearing the heaviest burden of the hardest work — that is not equality, it is an injustice we have chosen to overlook.`
      : population && geography
        ? `${cap(pop)} ${gIn} should have the same opportunities as everyone else. Right now, they do not — and that gap is not inevitable.`
        : isHealth
          ? `Every person facing this condition should have access to the best available care — not just those in the right postcode.`
          : `The communities doing the hardest work should not be the last to see the benefits of the progress being made around them.`,

    // 3 — "We should not accept..." — the collective moral claim
    geography
      ? `We should not accept that ${geography} remains on the wrong side of this divide — not when we know what needs to change.`
      : isGender
        ? `We should not accept a world where women carry a disproportionate share of this burden — that is a choice, not an inevitability.`
        : isHealth
          ? `We should not accept that where you are born determines whether you survive this — not when that does not have to be true.`
          : `We should not accept the gap between what this research makes possible and what communities are actually experiencing.`,

    // 4 — "[This situation] should not exist" — the naming framing
    isGender && geography
      ? `The fact that women ${gIn} still face this should concern all of us — it is not a development problem, it is a justice problem.`
      : geography
        ? `The inequality between what is possible for communities ${gIn} and what they are actually experiencing should not be this wide.`
        : `The distance between those who benefit from progress and those who need it most should not be measured in generations.`,

    // 5 — "Every [person] should..." — the rights framing
    population && geography
      ? `Every ${popSing} ${gIn} who wants a better life should have a genuine shot at one — not just the ones lucky enough to catch the right programme.`
      : isHealth
        ? `Every patient, wherever they live, should have access to the best available treatment — that is not an ambition, it is a baseline.`
        : `Every community this work is designed to help should genuinely benefit from it — not just read about it in someone else's success story.`,

  ];

  return statements;
}

export function generateKeyMessages(shouldStatement: string): string[] {
  const lower = shouldStatement.toLowerCase();

  const isAboutTech = lower.includes('technology') || lower.includes('solar') || lower.includes('mechanis') || lower.includes('digital') || lower.includes('thresher') || lower.includes('sorghum');
  const isAboutHealth = lower.includes('health') || lower.includes('patient') || lower.includes('cancer') || lower.includes('disease') || lower.includes('treatment');
  const isAboutAgri = lower.includes('farmer') || lower.includes('harvest') || lower.includes('crop') || lower.includes('food') || lower.includes('grain');
  const isAboutGender = lower.includes('women') || lower.includes('gender') || lower.includes('girls');
  const isAboutClimate = lower.includes('climate') || lower.includes('solar') || lower.includes('renewable') || lower.includes('carbon');

  if (isAboutTech || isAboutAgri) {
    return [
      "The technology exists and has been proven to work — what is missing is the will to bring it to the people who need it.",
      "The communities who stand to benefit most are the ones currently being left out of the technology conversation.",
      "Local production and local ownership are the keys to long-term sustainability — imported solutions rarely last.",
      "The economic case is clear: the return on this investment, in productivity, time, and wellbeing, far exceeds the cost.",
      isAboutGender
        ? "Gender equity is not a side benefit of this technology — for many communities, it is the entire point."
        : "This is not a pilot that needs more proof — it is a solution that needs more commitment.",
      "Scaling this solution does not require reinventing the wheel — it requires backing what already works.",
      isAboutClimate
        ? "This is not just good economics — it is climate-smart development that benefits both people and the planet."
        : "The barrier is not technical — it is political. The decision-makers have the power to change this today.",
    ];
  }

  if (isAboutHealth) {
    return [
      "Too many people are being diagnosed too late — and late diagnosis is a death sentence when it does not have to be.",
      "The treatment exists. The barrier is access — and that is a political decision, not a medical one.",
      "Every week of delay in funding this means real patients paying the price with their health.",
      "Prevention is not just better than cure — it is dramatically cheaper, and we already know how to do it.",
      "The communities most affected by this condition are the ones with the least access to solutions.",
      "Our current standard of care was designed for a different era. This research shows a better way.",
      "The human cost of inaction is quantifiable — and it is unconscionable when the alternative is within reach.",
    ];
  }

  // Default
  return [
    "The scale of this problem is larger than most decision-makers realise — and it affects people they have never met.",
    "There is a proven approach that works, tested in the field, and this is the evidence to back it.",
    "The human cost of the current situation is unacceptable when a practical, affordable solution already exists.",
    "The return on investment — in productivity, time, wellbeing, and economic output — makes this a compelling case.",
    "Every year without action is a year the communities who need this most fall further behind.",
    "This is not just about innovation — it is about justice. The people most affected have the least access to solutions.",
    "What works in one context can work in many — the challenge now is not proof of concept, it is proof of commitment.",
  ];
}

export function validateMessageAlignment(message: string, _ss: string): { aligned: boolean; feedback: string } {
  if (message.trim().length < 10) {
    return { aligned: false, feedback: "This message seems quite short. A strong key message should be a clear, specific claim that supports your should statement. Try to articulate exactly why your audience should care." };
  }
  return { aligned: true, feedback: "" };
}

export function explainMessage(_msg: string, index: number): string {
  const explanations = [
    "This message works because it creates urgency and makes the problem personal. When your audience realises this issue touches their own world, they move from passive listeners to active supporters. It connects to Emotional Language — making them feel something before you ask them to do something.",
    "This message is powerful because it shifts from problem to solution. You have established what is wrong — now you are offering hope. This is the Inspiration part of the PIP structure. The word proven adds Logical Language — credibility that reassures sceptics.",
    "This message combines emotional weight with a call to action. It frames inaction as a choice, which is a powerful persuasion technique. The Opposite Effect at work — instead of asking them to do something, you are asking why they would choose not to."
  ];
  return explanations[index % explanations.length];
}

export function generateStoryAdvice(story: string, messageIndex: number): string {
  if (story.trim().length < 20) {
    return "Tell me more — even a few sentences about what happened, who was involved, and how it felt. The best stories are specific and personal.";
  }
  return `Great story material. Here is how to use it effectively:\n\nLead with the human moment. Start with a specific detail — a name, a place, a time of day — that puts your audience in the scene. Visual Language makes this story come alive.\n\nBuild to the turning point. Your audience needs to feel the tension before the resolution. This is Suspense — do not give away the ending too early.\n\nConnect it back to your message. End by linking this story directly to your key message. The story is the vehicle; your message is the destination.\n\nThis story works well for Message ${messageIndex + 1} because it illustrates the real-world impact in a way data alone never could.`;
}

export function generateStatisticAdvice(stat: string, messageIndex: number): string {
  if (stat.trim().length < 5) {
    return "What numbers do you have? Think about: how many people are affected, what percentage improved, how much time or money is involved, before vs. after comparisons.";
  }
  return `Good statistic. Here is how to make it land:\n\nFrame it for impact. Do not just state the number — anchor it. "50% of farmers" is good. "1 in 2 smallholder farmers — meaning if your neighbour and you both farmed the same land, one of you is still doing it entirely by hand" is unforgettable.\n\nUse the minimum needed. One powerful, well-framed statistic beats ten charts. Your audience only needs enough data to believe your point.\n\nPair it with emotion. A statistic tells them it is real. A story tells them it matters. Together, they are unstoppable. This stat works perfectly alongside the story you have chosen for Message ${messageIndex + 1}.`;
}

export function generateSoundbiteOptions(_msg: string, messageIndex: number): string[] {
  const allOptions = [
    [
      "This is not a problem for tomorrow — it is happening in someone's field, home, or community right now.",
      "The question is not whether we can afford to act. It is whether we can afford not to.",
      "Behind every data point is a person waiting for us to get this right."
    ],
    [
      "We do not need more evidence. We need more courage to act on what we already know.",
      "The gap is not between what is possible and what we know — it is between what we know and what we choose to fund.",
      "The communities who need this most are not waiting for a perfect solution. They are waiting for us to show up."
    ],
    [
      "Every season this continues is a season too many for the people living through it.",
      "This is the kind of change that starts with a conversation and ends with a transformation.",
      "We are not just changing a process — we are changing a life trajectory."
    ]
  ];
  return allOptions[messageIndex % allOptions.length];
}

export function generateSoundbiteAdvice(_sb: string): string {
  return "This soundbite works because it is:\n\nShort and memorable. Under 15 words is ideal for a soundbite — something someone could repeat to a colleague without looking at their notes.\n\nEmotionally resonant. It creates a feeling, not just a thought. The best soundbites stay with people because they felt something when they heard them.\n\nQuotable. Imagine a journalist, a funder, or a colleague hearing this. Would they write it down? Would they repeat it? That is the test of a great soundbite.";
}

// ============================================================
// PIP Suggestions — Problem, Inspiration, Payoff
// Generates 3 context-specific options per role
// ============================================================

export interface PIPSuggestions {
  problem: string[];
  inspiration: string[];
  payoff: string[];
}

export function generatePIPSuggestions(docs: string, shouldStatement: string): PIPSuggestions {
  const ctx = extractDocumentContext(docs, shouldStatement);
  const { geography, population, domain, domainShort } = ctx;

  const p = population || 'the communities this research is designed to help';
  const pCap = cap(population || 'the communities this research is designed to help');
  const g = geography ? ` in ${geography}` : '';
  const gOf = geography ? ` of ${geography}` : '';
  const d = domain || 'this approach';
  const ds = domainShort || domain || 'this work';

  const lower = (docs + ' ' + shouldStatement).toLowerCase();
  const isAgri = lower.includes('farm') || lower.includes('sorghum') || lower.includes('harvest')
    || lower.includes('crop') || lower.includes('thresher') || lower.includes('grain') || lower.includes('mechanis');
  const isHealth = lower.includes('patient') || lower.includes('cancer') || lower.includes('disease')
    || lower.includes('clinic') || lower.includes('treatment') || lower.includes('medical');
  const isGender = lower.includes('women') || lower.includes('gender') || lower.includes('female');
  const isPolicy = lower.includes('policy') || lower.includes('government') || lower.includes('minister')
    || lower.includes('legislation') || lower.includes('regulation') || lower.includes('policymaker');
  const isSolar = lower.includes('solar') || lower.includes('renewable');

  let problem: string[], inspiration: string[], payoff: string[];

  if (isAgri) {
    problem = [
      geography
        ? `Manual, labour-intensive ${ds} remains one of the most significant unresolved constraints on productivity and wellbeing for ${p}${g} — a problem that is technically solvable, yet has received little serious investment.`
        : `${pCap} still rely on manual, labour-intensive methods for ${ds} — a time-consuming burden that limits productivity, income, and quality of life when better options exist.`,
      geography
        ? `Across ${geography}, ${p} spend hours each day on ${ds} tasks that could be mechanised — losing time, income, and energy to a problem that available technology could solve.`
        : `The gap between the ${ds} technology available globally and what ${p} actually have access to is not a technical gap — it is a gap in investment and commitment.`,
      isGender
        ? `Women and girls${g} bear a disproportionate share of the burden of manual ${ds} — a burden that limits their time, health, and economic opportunity, and that the right technology could dramatically reduce.`
        : `${pCap}${g} are locked into processing methods that have not changed in generations — not because better options are unavailable, but because no one has prioritised getting them there.`,
    ];

    inspiration = [
      geography
        ? `This project has designed and locally produced a ${d} that dramatically reduces processing time for ${p}${g} — built from locally available materials, priced for local realities, and tested in the conditions where it will actually be used.`
        : `This research has developed and field-tested a ${d} tailored specifically for the communities it is designed to serve — addressing the limitations that have made previous approaches fail.`,
      `Unlike imported or donor-dependent solutions, this ${ds} technology is locally produced, locally owned, and designed from the outset to be maintained and replicated without external support.`,
      geography
        ? `By combining ${isSolar ? 'solar power' : 'appropriate technology'} with participatory design and local manufacturing, this project has created a ${ds} solution that is both technically proven and economically viable for communities across ${geography}.`
        : `What makes this approach different is not what it proposes — it is what it has already demonstrated. The technology works, the uptake is measurable, and the model is ready to scale.`,
    ];

    payoff = [
      isGender && geography
        ? `If this technology reaches the communities it was designed for, women in ${geography} will reclaim hours each day previously lost to manual drudgery — time that translates directly into education, economic activity, and better health.`
        : geography
          ? `At scale, this technology changes more than how ${ds} is done — it changes who has time, who has income, and what is possible for rural households across ${geography}.`
          : `At scale, this approach does not just improve efficiency — it changes what is possible for the ${p} who currently have no better option.`,
      geography
        ? `A world where ${p} in ${geography} have access to affordable, locally produced ${ds} technology is a world with stronger food security, higher household incomes, and measurably less physical hardship.`
        : `If ${ds} technology like this reaches the communities that need it, the result is not just a more efficient process — it is a meaningfully better life for the people doing the work.`,
      isPolicy
        ? `The policy case is clear: investing in locally produced ${ds} technology${gOf} delivers food security${isGender ? ', gender equity,' : ''} and climate resilience at a fraction of the cost of conventional interventions. This research shows exactly where to start.`
        : `This research demonstrates that the barrier to better ${ds}${g} is not technical — it is a question of commitment. With the right investment, a proven solution exists, and the communities who need it are ready.`,
    ];

  } else if (isHealth) {
    problem = [
      `Too many ${p} are still receiving outdated or inadequate ${ds} — not because better options do not exist, but because those options are not reaching the people who need them.`,
      geography
        ? `The standard of ${ds} available to ${p}${g} has not kept pace with what research now makes possible — a gap with real and measurable consequences for health outcomes.`
        : `People who need better ${ds} are waiting — not because the science is unclear, but because the systems around them have not caught up with it.`,
      `The human cost of the current approach to ${ds} is quantifiable — and it is avoidable when the evidence for a better approach already exists.`,
    ];

    inspiration = [
      `This research has developed and clinically tested a ${ds} approach that delivers measurably better outcomes than the current standard — with a clear pathway to implementation at scale.`,
      `Unlike previous attempts, this approach specifically addresses the barriers — access, cost, and systemic inertia — that have prevented earlier innovations from reaching the people who need them.`,
      `The results are unambiguous: ${p} who receive this ${ds} intervention show significantly better outcomes — and the approach is designed from the outset to be scalable within existing systems.`,
    ];

    payoff = [
      `If this approach is implemented at the scale the evidence supports, the result is measurably fewer people facing unnecessary suffering, late diagnosis, or inadequate treatment.`,
      geography
        ? `${pCap}${g} who currently receive outdated ${ds} could, with the right investment, have access to an evidence-based approach that dramatically changes their prognosis and quality of life.`
        : `The transformation is achievable: more people get better outcomes, with the resources already available, through a system the evidence shows works.`,
      `This research does not just advance the science of ${ds} — it gives decision-makers a clear, costed, evidence-based case for change. The question is no longer whether we can. It is whether we will.`,
    ];

  } else {
    // General research default
    problem = [
      `The challenge this research addresses is not a lack of evidence — it is a persistent gap between what we know and what is reaching the communities who need it most.`,
      geography
        ? `${pCap}${g} are operating without access to the tools, knowledge, or support that could meaningfully change their situation — not because those things do not exist, but because they have not been prioritised.`
        : `${pCap} face a problem that is well documented, well understood, and consistently under-resourced. This research addresses that directly.`,
      `The status quo has a human cost. Every year without action in this space is a year that cost is paid by the people with the least power to change it.`,
    ];

    inspiration = [
      `This research takes a fundamentally different approach: rather than describing the problem further, it delivers a tested, evidence-based solution — and demonstrates that it works in practice.`,
      `What makes this work distinctive is not its ambition but its specificity: a clearly defined intervention, a testable hypothesis, and results that are already changing the picture for the communities involved.`,
      `Unlike previous work in this space, this approach was designed with the end in mind — not just to generate knowledge, but to generate the kind of knowledge that changes behaviour, policy, and practice.`,
    ];

    payoff = [
      geography
        ? `If this research achieves what the early evidence suggests is possible, ${p}${g} will have access to a proven solution to a problem that has constrained their lives and opportunities for a generation.`
        : `Success here means a measurable, demonstrable improvement in outcomes for ${p} — and a template for how evidence-based research can translate into real-world change.`,
      `The Payoff is not an academic contribution — it is a changed situation for real people. The research creates the roadmap; investment and commitment make it a reality.`,
      isPolicy
        ? `For policymakers, the implications are clear: this research removes the 'we need more evidence' barrier. The evidence is in. The question now is whether the political will matches the scientific case.`
        : `This is what research impact looks like: a named problem, a tested solution, and communities ready to use it. The missing piece is not more research — it is commitment to act on the research already done.`,
    ];
  }

  return { problem, inspiration, payoff };
}
