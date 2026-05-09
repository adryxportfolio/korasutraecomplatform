// Using Shopify product images as journal thumbnails

export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  keywords: string[];
}

export const journalArticles: JournalArticle[] = [
  {
    slug: 'recipe-for-a-revivalist',
    title: 'Recipe for a Revivalist',
    excerpt: 'The word revivalist once held meaning — of depth, rigour, and responsibility. Today, it\'s worn like a title, often without the work it demands. In craft, revival is not a trend — it\'s a long, quiet commitment.',
    content: `The word revivalist once held meaning — of depth, rigour, and responsibility. Today, it's worn like a title, often without the work it demands. In craft, revival is not a trend — it's a long, quiet, often thankless journey.

A true revivalist doesn't just showcase handloom. She goes to the source. She sits with weavers in their homes, learns the language of the loom, and understands why a particular motif exists — not just how it looks on fabric, but what it means to the community that created it.

Revival begins with listening. In Bengal's textile heartland, every weave has a story passed down through generations. The Baluchari saree, for instance, carries mythological narratives woven into silk — not as decoration, but as documentation. When we at Kora Sutra work with these artisans, we don't redesign their art. We provide a platform for it to breathe.

The danger of the modern "revival" movement is commodification. When handloom becomes a marketing keyword rather than a lived practice, the artisan fades into the background. True revival means fair wages, transparent sourcing, and a genuine relationship with the makers.

At Kora Sutra, we believe revival is measured not in Instagram posts but in looms that continue to operate, in families that can sustain themselves through their ancestral craft, and in a younger generation that sees dignity in weaving.

The recipe is simple but demanding: patience, respect, consistency, and a willingness to let the craft lead rather than the market.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/MaroonPureSilkKantha1.jpg?v=1767428179',
    author: 'Ananya Mukherjee',
    date: '2025-03-15',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['handloom revival', 'Indian textiles', 'artisan craft', 'sustainable fashion', 'Bengal weaving']
  },
  {
    slug: 'the-lost-art-of-baluchari-weaving',
    title: 'The Lost Art of Baluchari Weaving',
    excerpt: 'Once a prized possession of Bengal\'s aristocracy, the Baluchari saree carries mythological stories woven into every inch of silk. Today, fewer than a hundred weavers keep this tradition alive.',
    content: `Once a prized possession of Bengal's aristocracy, the Baluchari saree carries mythological stories woven into every inch of silk. Today, fewer than a hundred weavers keep this tradition alive in the quiet town of Bishnupur, Bankura.

The Baluchari tradition dates back to the 18th century, originating in the village of Baluchar in Murshidabad. These sarees were never meant for everyday wear — they were ceremonial garments, each one a canvas of narrative art. The pallu of a traditional Baluchari saree depicts scenes from the Ramayana or Mahabharata, rendered entirely through the weaving process, not printing or embroidery.

What makes Baluchari weaving extraordinary is the technique. The weaver uses a jacquard loom, controlling hundreds of threads to create intricate pictorial designs. A single Baluchari saree can take anywhere from 15 days to 3 months to complete, depending on the complexity of the motifs.

The colours used in traditional Baluchari weaving hold significance. Deep maroon represents prosperity, while royal blue signifies divinity. Gold zari threads are interwoven to create borders that frame the narrative panels like a sacred text.

Kora Sutra's Baluchari collection honours this heritage. Each piece we curate comes directly from the master weavers of Bishnupur. We ensure that the pricing reflects the true value of the artisan's time and skill — not the discounted rate that mass production demands.

When you drape a Baluchari saree, you're not just wearing fabric. You're carrying a chapter of Indian history on your shoulders.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/5C778505-3213-4F9C-8D0B-F7B4AAC96F01.png?v=1767670371',
    author: 'Priyanka Dasgupta',
    date: '2025-03-08',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['Baluchari saree', 'Bengal silk saree', 'Bishnupur weaving', 'handwoven silk', 'traditional Indian saree']
  },
  {
    slug: 'tussar-silk-bengals-golden-thread',
    title: 'Tussar Silk — Bengal\'s Golden Thread',
    excerpt: 'Known as the "gold of textiles," Tussar silk has a rich, earthy texture that sets it apart from every other silk variant. Here\'s why this wild silk deserves a place in every saree lover\'s collection.',
    content: `Known as the "gold of textiles," Tussar silk has a rich, earthy texture that sets it apart from every other silk variant. Produced by silkworms that feed on trees like Terminalia and Shorea, Tussar silk carries the warmth of the forest in its very fibres.

Unlike mulberry silk, which is cultivated in controlled environments, Tussar silk comes from wild silkworms — primarily the Antheraea mylitta species found across Jharkhand, Bihar, Chhattisgarh, and parts of Bengal. This wild origin gives Tussar its characteristic golden-brown hue and slightly coarse, textured hand-feel that silk purists adore.

The process of creating a Tussar silk saree is labour-intensive. After the cocoons are harvested, the silk is hand-reeled, spun, and woven on handlooms. The natural imperfections — slight variations in thread thickness, subtle colour gradations — are not flaws but signatures of authenticity.

At Kora Sutra, our Tussar silk sarees come from weaving clusters in Bhagalpur and Bengal's Birbhum district. We work with weavers who have inherited their craft through five or six generations. Each saree is a collaboration between the natural elegance of the silk and the artistic vision of the weaver.

Tussar silk drapes beautifully. It has a natural stiffness that holds pleats well, making it ideal for formal occasions. As you wear it, the silk softens and moulds to your body, becoming more comfortable with each draping.

For women who appreciate understated luxury — fabric that speaks through texture rather than embellishment — Tussar silk is the definitive choice.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/780FF1D4-8DDC-4C3E-B27B-4B39EBEAC171.jpg?v=1771694723',
    author: 'Rishita Sen',
    date: '2025-02-28',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['Tussar silk saree', 'wild silk India', 'Bhagalpur silk', 'handloom Tussar', 'natural silk saree']
  },
  {
    slug: 'why-muslin-is-making-a-comeback',
    title: 'Why Muslin Is Making a Comeback',
    excerpt: 'Once so fine it was called "woven air," Bengal\'s legendary Muslin is experiencing a quiet renaissance. We explore why this ancient fabric resonates with the modern Indian woman.',
    content: `Once so fine it was called "woven air," Bengal's legendary Muslin is experiencing a quiet renaissance. The fabric that Mughal empresses draped themselves in — so sheer that yards of it could pass through a ring — is finding new admirers among women who value heritage and comfort in equal measure.

Dhakai Muslin, the finest variety, was historically woven in the Dhaka region (now Bangladesh). The thread count was so high — sometimes exceeding 1,200 threads per inch — that the fabric was practically translucent. British colonial policies systematically destroyed this industry, and for decades, true Muslin remained a museum piece.

Today's Muslin revival is different. While we may never recreate the exact fineness of Dhakai Muslin — the cotton variety used, Phuti karpas, is now extinct — contemporary weavers have developed techniques that capture Muslin's essential qualities: lightness, breathability, and an almost cloud-like drape.

Kora Sutra's Muslin sarees are woven from fine cotton and cotton-silk blends that honour the Muslin tradition. They're perfect for India's climate — airy enough for a summer afternoon, elegant enough for an evening gathering.

What makes modern Muslin special is its versatility. A Muslin saree transitions effortlessly from a work meeting to a dinner party. It doesn't crease easily, it breathes in humid weather, and it develops a beautiful softness over time.

For the woman who wants to drape history without sacrificing comfort, Muslin is not just a fabric — it's a philosophy of dressing.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/351610E0-3729-4B40-816E-F2242F47101D.png?v=1770808032',
    author: 'Kaveri Bhattacharya',
    date: '2025-02-20',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['Muslin saree', 'Dhakai Muslin', 'Bengal Muslin', 'lightweight saree', 'cotton silk saree', 'summer saree India']
  },
  {
    slug: 'kantha-stitch-stories-sewn-in-thread',
    title: 'Kantha Stitch — Stories Sewn in Thread',
    excerpt: 'What began as a rural Bengali woman\'s way of recycling old cloth has become one of India\'s most recognisable embroidery traditions. The Kantha stitch carries stories of home, memory, and quiet resilience.',
    content: `What began as a rural Bengali woman's way of recycling old cloth has become one of India's most recognisable embroidery traditions. The Kantha stitch — a simple running stitch worked across layers of fabric — carries stories of home, memory, and quiet resilience.

In its earliest form, Kantha was born of necessity. Women in rural Bengal would layer old saris and dhotis, stitching them together with threads pulled from the borders of the fabrics themselves. These quilts, called "nakshi kantha," served as blankets, baby wraps, and ceremonial gifts. The stitching wasn't random — women would embroider motifs from their daily lives: lotus flowers, fish, peacocks, the tree of life.

The beauty of Kantha lies in its imperfection. No two Kantha pieces are identical. The slight irregularity of hand-stitching, the subtle texture created by the running stitch rippling across the fabric — these are the marks of a human hand, not a machine.

When Kantha stitch is applied to silk sarees, the result is extraordinary. The embroidery adds texture and depth to the silk surface, creating a tactile experience that printed or woven patterns cannot replicate. At Kora Sutra, our Kantha stitch sarees feature motifs that range from traditional (paisley, lotus, birds) to contemporary (geometric patterns, abstract designs), all executed by skilled artisans from Bengal's Birbhum and Bolpur regions.

A Kantha stitch saree is not just clothing — it's portable art. Each motif tells a story, and the woman who wears it becomes part of that narrative tradition.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/16B10BD3-7E27-4F6E-9062-F26B89A6BF65.jpg?v=1767666128',
    author: 'Supriya Ghosh',
    date: '2025-02-10',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['Kantha stitch saree', 'Kantha embroidery', 'Bengal embroidery', 'handstitched saree', 'nakshi kantha', 'running stitch textile']
  },
  {
    slug: 'jamdani-the-poetry-of-the-loom',
    title: 'Jamdani — The Poetry of the Loom',
    excerpt: 'UNESCO-recognised and centuries old, Jamdani weaving is a meditation in patience. Each motif is woven directly into the fabric using supplementary weft threads, making every piece irreplaceable.',
    content: `UNESCO-recognised and centuries old, Jamdani weaving is a meditation in patience. Unlike embroidery, where patterns are added after the fabric is woven, Jamdani motifs are woven directly into the fabric using supplementary weft threads. This means every single design element is created on the loom itself — making each piece truly irreplaceable.

The Jamdani tradition has its roots in the Mughal period, though some historians trace it even further back to ancient Bengal. The word "Jamdani" is believed to come from the Persian words "jam" (flower) and "dani" (vase) — a fitting etymology for a textile tradition built on floral motifs.

What makes Jamdani technically remarkable is the discontinuous supplementary weft technique. The weaver uses small shuttles, sometimes bamboo sticks, to manually insert pattern threads into the base fabric. This process is painstakingly slow — a single Jamdani saree with complex motifs can take 6 to 12 months to complete.

The motifs in Jamdani weaving are a lexicon of Bengali aesthetics: the "panna" (emerald-shaped), "kolka" (paisley), "hazar buti" (thousand buds), and "jaal" (net pattern). Each has been refined over centuries, passed from master weaver to apprentice.

At Kora Sutra, our Jamdani sarees are sourced from weavers in Nadia and Shantipur, West Bengal. We offer both traditional cotton Jamdani and the more luxurious Jamdani work on Tussar and silk bases.

To wear a Jamdani saree is to wear time itself — every motif representing hours of focused human effort, every thread a testament to a weaver's devotion to their art.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/4A40BE21-B036-4CD5-A971-EA71F0C5DCDA.jpg?v=1771685929',
    author: 'Madhurima Roy',
    date: '2025-01-30',
    category: 'Journal',
    readTime: '8 min read',
    keywords: ['Jamdani saree', 'Jamdani weaving', 'UNESCO handloom', 'Bengal Jamdani', 'handwoven Jamdani', 'Shantipur saree']
  },
  {
    slug: 'block-printing-handmade-impression',
    title: 'Block Printing — The Handmade Impression',
    excerpt: 'In an age of digital printing, hand block printing stands as a defiant art form. Each stamp of the wooden block is a conscious choice, and no two prints are ever exactly the same.',
    content: `In an age of digital printing, hand block printing stands as a defiant art form. Each stamp of the wooden block is a conscious choice — the pressure, the angle, the overlap — and no two prints are ever exactly the same.

Block printing on textiles in India dates back over 3,000 years. Archaeological evidence from sites like Mohenjo-daro suggests that the Indus Valley civilisation practiced fabric dyeing and printing techniques. Over millennia, different regions developed their own block printing traditions: Bagru and Sanganer in Rajasthan, Pethapur in Gujarat, and Machilipatnam in Andhra Pradesh.

The process begins with the block itself. Skilled carvers — often a separate community of artisans — create intricate designs on teak wood blocks. A single design might require multiple blocks: one for the outline, one for each colour fill, and one for background patterns. The blocks are dipped in natural or chemical dyes and pressed onto the fabric by hand, one impression at a time.

When block printing meets handloom sarees, the result is a garment of dual craftsmanship. The fabric is handwoven, and the pattern is hand-printed — doubling the artisanal value. At Kora Sutra, our block print sarees feature designs that range from traditional geometric borders to bold all-over patterns inspired by Bengal's flora.

The slight irregularities in block printing — a fractional shift in alignment, a variation in colour intensity — are precisely what makes each piece unique. In a world of identical mass production, these "imperfections" are the most perfect thing about the craft.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/E257215B-5A5F-43AB-AE9E-D45DE6D87E11.jpg?v=1771689000',
    author: 'Tanvi Sharma',
    date: '2025-01-20',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['block print saree', 'hand block printing', 'handmade textile India', 'artisan printing', 'traditional print saree']
  },
  {
    slug: 'understanding-pure-silk-batik',
    title: 'Understanding Pure Silk Batik',
    excerpt: 'Batik is one of the oldest known methods of textile decoration, using wax-resist dyeing to create intricate patterns. On pure silk, the results are nothing short of mesmerising.',
    content: `Batik is one of the oldest known methods of textile decoration, using wax-resist dyeing to create intricate patterns. While the technique is most famously associated with Indonesia, India's Batik tradition — particularly in West Bengal — has a distinct character and beauty all its own.

Indian Batik, especially the variety practiced in Bishnupur and Sonamukhi in Bengal, uses a combination of hot wax application and natural dyeing processes. The artisan draws or stamps patterns onto the silk using molten wax, then immerses the fabric in dye. The waxed areas resist the dye, creating a negative pattern. This process is repeated multiple times for multi-coloured designs, with each layer building complexity.

What makes silk Batik special is the way the fabric interacts with the wax and dye. Silk absorbs colour differently than cotton — the result is a luminous, almost glowing quality that cotton Batik doesn't achieve. The fine "crackle" lines that appear when the wax naturally cracks during the dyeing process give Batik its characteristic veined appearance.

Kora Sutra's pure silk Batik sarees come from the Bishnupur region, where Batik printing has been practiced for over a century. Our artisans use a combination of hand-drawn (tulis) and stamped (cap) Batik techniques, sometimes on a single saree, creating layers of pattern complexity.

A Batik saree is wearable art — each one bearing the unique signature of the artisan's hand, the unpredictable beauty of the resist-dyeing process, and the living quality of pure silk.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/120B7527-F607-40B0-9916-EF70E1FFCCF7.png?v=1767530272',
    author: 'Debalina Chatterjee',
    date: '2025-01-10',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['Batik saree', 'pure silk Batik', 'Bishnupur Batik', 'wax resist dyeing', 'Indian Batik saree', 'hand Batik silk']
  },
  {
    slug: 'linen-sarees-for-modern-woman',
    title: 'Linen Sarees for the Modern Woman',
    excerpt: 'Linen is having its moment. Breathable, sustainable, and effortlessly elegant, linen sarees are the go-to choice for women who want to look polished without trying too hard.',
    content: `Linen is having its moment — and for good reason. Breathable, sustainable, and effortlessly elegant, linen sarees are the go-to choice for women who want to look polished without trying too hard.

Linen is made from flax fibres, making it one of the most eco-friendly fabrics available. It requires significantly less water than cotton to produce, biodegrades naturally, and grows without the need for heavy pesticides. For the environmentally conscious saree lover, linen is a guilt-free indulgence.

But sustainability alone doesn't explain linen's appeal. The fabric has a natural crispness that holds pleats beautifully, gives the drape structure, and creates clean, architectural lines when worn. Unlike some heavier silks that can feel oppressive in Indian summers, linen breathes. It absorbs moisture without feeling damp, making it ideal for tropical climates.

At Kora Sutra, we pair linen with traditional Bengal weaving techniques — Jamdani motifs, zari borders, and block print patterns — to create sarees that bridge contemporary fashion and artisanal heritage. Our linen sarees are designed for the woman who moves through her day with purpose: from office meetings to evening gatherings, from casual brunches to festive celebrations.

The care for linen is simpler than most assume. While it wrinkles — that's part of its charm — a light iron or steamer restores its crisp finish. Over time, linen softens without losing its structure, becoming more comfortable with each wear.

Linen isn't just a fabric; it's an attitude. Relaxed, confident, and inherently sophisticated.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/PinkLinenNiddleWork1.jpg?v=1767428266',
    author: 'Nandita Bose',
    date: '2024-12-28',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['linen saree', 'sustainable saree', 'eco-friendly saree', 'summer saree', 'linen handloom', 'office wear saree']
  },
  {
    slug: 'art-of-draping-a-beginners-guide',
    title: 'The Art of Draping — A Beginner\'s Guide',
    excerpt: 'Draping a saree can feel intimidating if you didn\'t grow up watching your mother do it every morning. Here\'s our simple, step-by-step guide to help you find your own draping style.',
    content: `Draping a saree can feel intimidating if you didn't grow up watching your mother do it every morning. But here's the truth: there's no single "right" way to drape a saree. The beauty of this six-yard fabric lies in its adaptability — it can be draped in over 80 documented styles across India.

The most common drape is the Nivi style, popularised in Andhra Pradesh and now worn across the country. Here's a simplified guide:

Start with a well-fitted petticoat (underskirt) tied firmly at your waist. Tuck the plain end of the saree into the petticoat at your navel, wrapping it around your body from right to left. Make one complete round.

Once you've completed the round, start making pleats from the front. Take about 5-7 pleats, each approximately 5 inches wide. Tuck the pleated section into the petticoat at the centre front, ensuring the pleats fall straight and face left.

Take the remaining fabric (the pallu) and drape it over your left shoulder. Pin it in place with a small safety pin at the shoulder for security.

Tips for different fabrics: Silk sarees hold pleats well but can be slippery — use a cotton petticoat for grip. Muslin and linen drape more casually and need fewer, looser pleats. Tussar silk has natural stiffness that creates beautiful, structured pleats.

For beginners, we recommend starting with a cotton or linen saree — they're easier to handle and more forgiving of imperfect pleats. As you gain confidence, move to silk and other fabrics.

Remember: the best-draped saree is the one you feel comfortable in. Don't stress about perfection. The saree has been worn for thousands of years precisely because it adapts to the woman wearing it, not the other way around.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/4BB8364E-F5BB-4AD6-85ED-141CC868C40B.png?v=1767530519',
    author: 'Sreelakshmi Nair',
    date: '2024-12-15',
    category: 'Journal',
    readTime: '8 min read',
    keywords: ['how to drape saree', 'saree draping guide', 'Nivi drape', 'saree for beginners', 'saree styling tips', 'Indian saree draping']
  },
  {
    slug: 'handloom-vs-powerloom-knowing-the-difference',
    title: 'Handloom vs Powerloom — Knowing the Difference',
    excerpt: 'In a market flooded with machine-made sarees marketed as "handloom," knowing how to distinguish authentic handwoven textiles is more important than ever.',
    content: `In a market flooded with machine-made sarees marketed as "handloom," knowing how to distinguish authentic handwoven textiles is more important than ever. The difference isn't just about quality — it's about livelihoods, sustainability, and cultural preservation.

A handloom saree is woven on a manually operated loom. The weaver controls the tension, speed, and pattern through physical effort — foot pedals operate the heddles, and the shuttle is thrown by hand. This process is slow (a handloom weaver produces approximately 5-6 metres of fabric per day) but results in fabric with unique characteristics.

A powerloom saree is woven on an electrically powered loom that automates the process. Production is faster (up to 200 metres per day) and cheaper, but the fabric lacks the subtle variations that give handloom its charm.

How to tell the difference:

Selvedge (edges): Handloom sarees have slightly irregular selvedge edges because the weaver manually adjusts the threads. Powerloom sarees have perfectly uniform, machine-finished edges.

Thread texture: Run your hand along a handloom fabric. You'll feel slight variations in thread thickness and tension — this is the weaver's signature. Powerloom fabric feels uniformly smooth.

Reversibility: Many handloom sarees, especially Jamdani and Baluchari, look identical on both sides. Powerloom versions often have loose threads and uneven patterns on the reverse.

The Handloom Mark: Look for the Indian government's official Handloom Mark — a certification that guarantees the textile is genuinely handwoven.

At Kora Sutra, every saree we sell is authenticated handloom. We believe transparency isn't a selling point — it's a responsibility.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/IMG_8389.png?v=1768012655',
    author: 'Aparajita Dey',
    date: '2024-12-05',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['handloom saree', 'handloom vs powerloom', 'authentic handloom', 'handwoven saree', 'handloom mark India', 'how to identify handloom']
  },
  {
    slug: 'caring-for-your-silk-saree',
    title: 'Caring for Your Silk Saree',
    excerpt: 'A silk saree, properly cared for, can last generations. Here are our expert tips on storing, cleaning, and maintaining your precious handwoven silks.',
    content: `A silk saree, properly cared for, can last generations — becoming an heirloom passed from mother to daughter. But silk is a natural protein fibre that requires specific care to maintain its lustre and strength.

Storage is everything. The biggest enemy of silk is not dirt — it's moisture and moths. Always store silk sarees in pure cotton cloth (malmal) or acid-free tissue paper, never in plastic. Plastic traps moisture, which can cause mildew and weaken the fibres. If you're storing for long periods, add dried neem leaves or cedar blocks — they're natural moth repellents.

Fold your sarees differently each time you store them. Silk fibres can weaken along fold lines over time, and changing the fold prevents permanent creases.

Cleaning should be gentle. For regular maintenance, airing the saree for a few hours in shade is sufficient. If the saree needs washing, dry cleaning is recommended for heavy silks like Baluchari and Banarasi. For lighter silks like Tussar, a gentle hand wash in cold water with a mild detergent works well. Never wring silk — gently press out excess water and lay flat to dry in shade.

For stain removal, act quickly. Blot (don't rub) the stain with a clean cloth. For oil stains, a dusting of cornstarch before washing can help. For stubborn stains, always consult a professional dry cleaner experienced with silk.

Ironing should be done on the reverse side with a cool iron or through a thin cotton cloth. Steam works beautifully on silk without the risk of scorching.

At Kora Sutra, we include care instructions with every saree we sell, because we believe a saree isn't just a purchase — it's the beginning of a relationship.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/GreyPureSilkWaxBatik1.jpg?v=1767449606',
    author: 'Gargi Majumdar',
    date: '2024-11-25',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['silk saree care', 'how to store silk saree', 'silk saree maintenance', 'handloom saree care', 'saree storage tips']
  },
  {
    slug: 'zari-work-the-golden-border',
    title: 'Zari Work — The Golden Border',
    excerpt: 'The shimmering zari border on a saree isn\'t just decorative — it represents centuries of metalwork artistry. We trace the journey of real zari from gold wire to woven glory.',
    content: `The shimmering zari border on a saree isn't just decorative — it represents centuries of metalwork artistry woven into textile tradition. The word "zari" comes from the Persian word "zar," meaning gold, and true zari lives up to its name.

Authentic zari is made by drawing fine gold or silver wire and wrapping it around a silk or cotton core thread. This process, called "kalabattu," is itself a craft requiring specialised skills. Surat in Gujarat has historically been the centre of zari production in India, with families practicing the craft for generations.

The application of zari in sarees varies by region and tradition. In Banarasi weaving, zari creates elaborate brocade patterns across the entire fabric. In Bengal's handloom tradition, zari is more restrained — used primarily in borders and pallu designs, creating elegant frames for the handwoven motifs within.

At Kora Sutra, our Jamdani and linen sarees often feature zari pallu work — the decorative end piece that drapes over the shoulder. The combination of handwoven Jamdani motifs with a zari pallu creates a saree that's both festive and refined, perfect for occasions that call for understated glamour.

The warmth of gold zari against natural silk or linen creates a visual harmony that synthetic alternatives simply cannot replicate. When you hold a saree with real zari up to the light, the metallic threads catch and scatter light in a way that feels alive — not the flat, uniform shine of plastic-coated thread.

Real zari is an investment. But like all genuine things, it rewards with beauty that deepens over time.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/23EEAE6D-68CF-409F-B840-E3611A2B312C.jpg?v=1768894091',
    author: 'Pallavi Menon',
    date: '2024-11-15',
    category: 'Journal',
    readTime: '6 min read',
    keywords: ['zari work saree', 'gold zari border', 'zari saree India', 'Banarasi zari', 'metalwork textile', 'zari pallu saree']
  },
  {
    slug: 'saree-for-every-season',
    title: 'A Saree for Every Season',
    excerpt: 'India\'s diverse climate demands different fabrics for different seasons. From cool linens for summer to warm Tussars for winter, here\'s your seasonal saree guide.',
    content: `India's diverse climate demands different fabrics for different seasons. The versatility of the saree lies not just in its draping styles but in the sheer variety of fabrics available — each suited to different weather conditions, occasions, and moods.

Summer (March to June): This is the season for breathable fabrics. Cotton sarees — tant, khadi, and handloom cotton — are your best friends. Linen sarees offer a slightly more polished look while maintaining excellent breathability. Muslin, with its legendary lightness, is perfect for the hottest days. Avoid heavy silks during peak summer — they trap heat and can be uncomfortable.

Monsoon (July to September): The rains call for fabrics that can handle humidity. Cotton is again a good choice — it absorbs moisture and dries relatively quickly. Avoid pure silk during monsoon as water can stain and damage the fibres. If you must wear silk, opt for blended varieties that are more resilient.

Autumn and Winter (October to February): This is the season to bring out your silks. Tussar silk, with its natural warmth and weight, is perfect for autumn. Heavy Banarasi and Baluchari silks come into their own during winter weddings and festive occasions. Kantha stitch sarees, with their layers of fabric, provide gentle warmth without bulk.

Festive Season (typically October to December): For Durga Puja, Diwali, and wedding season, choose sarees that make a statement. Baluchari sarees with mythological motifs, Jamdani with intricate weaving, or block print silks with bold patterns — this is the time to celebrate craftsmanship.

At Kora Sutra, we curate our collections with seasonality in mind, ensuring you always have the perfect saree for the moment.`,
    image: 'https://cdn.shopify.com/s/files/1/0800/5258/4666/files/RustTissueLinenSequins1.png?v=1767450298',
    author: 'Mitali Saha',
    date: '2024-11-05',
    category: 'Journal',
    readTime: '7 min read',
    keywords: ['seasonal saree guide', 'summer saree', 'winter saree', 'monsoon saree', 'festive saree India', 'saree for wedding season', 'which saree to wear']
  },
];
