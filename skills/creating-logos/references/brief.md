# The brief

A designer's first meeting is not a questionnaire. They arrive having looked at the
business, and they ask you to *correct* what they got wrong. Do the same.

## Read the room first

Everything in this table is usually answerable without asking. Asking anyway is what
makes an intake feel like paperwork.

| Question | Where the answer already is |
| --- | --- |
| What does the product do? | README first paragraph, landing page hero, package description |
| Who is it for? | pricing page, docs tone, marketing copy, target keywords |
| What is it called, and is the name doing work? | manifest `name`, wordmark in existing assets |
| What does it look like today? | existing logo files, favicon, OG image, `public/` |
| What colours does the product actually use? | theme tokens — `--primary`, Tailwind config, design-system package |
| What typeface does the product use? | font imports, `@font-face`, tailwind `fontFamily` |
| Where will the mark appear? | favicon links, app manifest, `.icns` in packaging, email templates |
| Who are the competitors? | README comparisons, landing copy, marketing pages |

State what you found. Getting one wrong is fine and useful — being corrected is
faster for the user than answering from scratch.

## What you must actually ask

Only the things a repo cannot tell you — and **one at a time**, in this order. Each
answer changes the next question, and the user will often want to brainstorm a
choice rather than tick it. Bundling them denies that.

1. **The feeling.** Decides more than any other answer and is never in the code.
   Do not ask it in words — **render each candidate register as a small complete
   identity** (mark, colour, and how the wordmark is set), because a feeling is
   carried by all three. "Precise" and "warm" are indistinguishable as adjectives
   and unmistakable as pictures. Argue each one **from the product**: the claim it
   makes believable, who it is aimed at, what it costs, and who already owns it.
   Show it where the mark actually appears — a header, a share card, a tab — not as
   an icon floating on a swatch.
2. **The finish.** From the style catalogue, shown rendered — not described.
3. **What is off-limits.** Directions already rejected, marks they dislike, anything
   the founder is tired of seeing. Cheapest question in the set: it prevents whole
   wasted rounds.
4. **A reference they admire.** Any product, any category. Then *fetch the images
   and look at them* — never work from the adjectives they used.
5. **Where it ships.** Only if the repo was ambiguous. Drives the export bundle and
   whether a single-tone drawing is mandatory.

## Things worth confirming, not asking

Offer these as a statement with an easy "no":

- "Your UI primary is neutral-800, so I'll keep the mark ink with one accent unless
  you want the brand to diverge from the product."
- "I can see Pacifico in the wordmark — I'm assuming that goes."
- "There's a previous exploration in `docs/brand/` — do you want it built on, or set
  aside?"

## The one word that ruins briefs

**"Modern."** It means nothing and everyone says it. If it comes up, convert it:
modern like *Linear* (restrained, material, dark-first) is the opposite of modern
like *Clay* (illustrated, warm, dimensional). Get a name, then fetch its images.
