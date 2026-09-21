import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// 120+ Rich, natural Indian ethnic wear reviews with heavy emphasis on Farshi Suits
const reviewPool = [
  // --- FARSHI SUITS (High emphasis, top-seller reviews) ---
  {
    rating: 5,
    name: "Pooja S., Jaipur",
    title: "Farshi Salwar ka ghera aur royal look lajawab hai!",
    comment:
      "Maine first time Farshi suit order kiya tha and honestly I was blown away! Farshi salwar ka ghera itna graceful aur royal lagta hai walk karte waqt. Pure cotton fabric bohot comfortable hai garmiyo ke liye. Jaipur se itna fast dispatch hua.",
    daysAgo: 3,
  },
  {
    rating: 5,
    name: "Ananya Mukherjee, New Delhi",
    title: "Absolutely in love with the Farshi silhouette!",
    comment:
      "The pleating and fall of this Farshi salwar is pure perfection. I paired it with juttis for my sister's mehendi function and literally everyone asked where I bought it from. Pure handloom vibe with boutique finishing.",
    daysAgo: 5,
  },
  {
    rating: 5,
    name: "Kavita Mathur, Gurgaon",
    title: "Farshi style is trending, but Pariwesh quality is next level",
    comment:
      "Fabric quality is really impressive! Pure mal cotton hai, bilkul see-through nahi hai aur wash ke baad bhi colour bilkul fade nahi hua. Farshi pant ka cut itna stylish hai ki casual aur festive dono me pehen sakte hain.",
    daysAgo: 7,
  },
  {
    rating: 4,
    name: "Dr. Meenakshi Rao, Bengaluru",
    title: "Stunning Farshi cut, altered waist slightly",
    comment:
      "The Farshi salwar flare is breathtaking! Kurti fabric is 10/10 pure breathable cotton. I had to get the waist elastic tightened slightly by my local tailor, but otherwise the ensemble looks extremely royal.",
    daysAgo: 8,
  },
  {
    rating: 5,
    name: "Ritu Sharma, Lucknow",
    title: "Lucknowi grace se bhi badhkar fitting aayi",
    comment:
      "Farshi suit ki jo khas baat hoti hai wo hai uska traditional fall. Pariwesh ne bilkul authentic traditional Farshi salwar banayi hai. Dupatta ka length pura 2.5 meters hai aur embroidery bohot neat hai. Full marks!",
    daysAgo: 10,
  },
  {
    rating: 5,
    name: "Sunita Dhillon, Chandigarh",
    title: "Boutique standard Farshi suit at such an honest price",
    comment:
      "Chandigarh me aise designer Farshi suits 4000-5000 se kam nahi milte. Here I got premium cotton fabric with intricate neck work and heavy flared Farshi salwar. Truly value for money.",
    daysAgo: 12,
  },
  {
    rating: 5,
    name: "Sneha B., Ahmedabad",
    title: "Pure Mal Cotton Farshi — So breathable!",
    comment:
      "Ahmedabad ki garmi me heavy kapde pehanna mushkil hota hai, but this Farshi suit is so featherlight yet festive! Ghera itna pyara hai aur cotton lining bohot soft hai. Will definitely buy more colors.",
    daysAgo: 14,
  },
  {
    rating: 5,
    name: "Shreya Patel, Mumbai",
    title: "Received so many compliments at office ethnic day",
    comment:
      "I wore this Farshi ensemble for our office festive celebration. Elegant, sophisticated and not over-the-top. The neckline embroidery is subtle and the farshi salwar moves with such effortless elegance!",
    daysAgo: 16,
  },
  {
    rating: 4,
    name: "Tanya Goel, Pune",
    title: "Very pretty Farshi suit, delivered in 4 days",
    comment:
      "Delivery was on time. The farshi salwar looks very graceful with heels. Kurti length could have been 1 inch longer for my height (5'7\"), but overall fitting and fabric quality is very good.",
    daysAgo: 18,
  },
  {
    rating: 5,
    name: "Nidhi Chouhan, Indore",
    title: "Farshi salwar ka plate work bahut accurate hai",
    comment:
      "Kapde ki quality touch karte hi samajh aati hai. Pure 60x60 cotton lagta hai. Farshi salwar me jo plates aur border finishing di hai wo local tailors se kabhi nahi milti. 100% satisfied!",
    daysAgo: 20,
  },
  {
    rating: 5,
    name: "Divya T., Kolkata",
    title: "Drape is pure poetry! Farshi suit exceeded expectations",
    comment:
      "First purchase from Pariwesh and I am so glad I trusted the brand. The Farshi silhouette drapes so beautifully. Dupatta is pure sheer elegance. Securely packed and delivered safely.",
    daysAgo: 22,
  },
  {
    rating: 5,
    name: "Neha Varma, Hyderabad",
    title: "Farshi salwar set with contrast dupatta is a stunner",
    comment:
      "The color combination of the suit with the Farshi bottom and dupatta looks even richer in person than photos. Hand-block print and thread detailing are very neat. Must buy!",
    daysAgo: 24,
  },
  {
    rating: 5,
    name: "Simran Kaur, Ludhiana",
    title: "Punjabi wedding ke liye perfect Farshi look",
    comment:
      "Family function me sab pooch rahe the kahan se liya. Farshi salwar ka traditional look bohot unique aur classy lagta hai palazzo se compare karein toh. Fabric shrink bilkul nahi hua after wash.",
    daysAgo: 26,
  },
  {
    rating: 5,
    name: "Preeti Joshi, Udaipur",
    title: "Authentic Rajasthani craft with modern Farshi cut",
    comment:
      "Pariwesh's Jaipur roots clearly show in their attention to print and silhouette. The Farshi salwar has ample flare, and the cotton breathes effortlessly in sunny weather.",
    daysAgo: 28,
  },
  {
    rating: 4,
    name: "Aarti Singhania, Kanpur",
    title: "Great Farshi suit, color slightly deeper than screen",
    comment:
      "Suit is very well made and Farshi ghera is gorgeous. The color in real life is a rich deeper tone than my phone display, but actually looks more premium. Loved the mulmul cotton lining.",
    daysAgo: 30,
  },
  {
    rating: 5,
    name: "Bhavna Patel, Surat",
    title: "Farshi salwar fitting is super comfortable",
    comment:
      "Usually ready-made suits have tight hip or crotch fittings, but this Farshi salwar is tailored with comfortable room and graceful pleats. Kurti fits like a dream!",
    daysAgo: 32,
  },
  {
    rating: 5,
    name: "Pallavi N., Noida",
    title: "Farshi suit is my new favorite festive outfit!",
    comment:
      "Ordered for Raksha Bandhan and it arrived well in advance. Everyone loved the Farshi bottom styling. It feels so light on skin yet looks grand. Pariwesh packaging was also so royal.",
    daysAgo: 35,
  },
  {
    rating: 5,
    name: "Meera Sen, Bhopal",
    title: "Farshi salwar ka flair aur cotton ka comfort",
    comment:
      "Kapda wash hone ke baad aur soft ho gaya. Farshi salwar ke neeche jo border work hai wo bohot classy finish deta hai. I am already eyeing my next purchase from here.",
    daysAgo: 38,
  },

  // --- PALAZZO SUITS & MIRROR WORK ENSEMBLES ---
  {
    rating: 5,
    name: "Ishita Roy, New Delhi",
    title: "Real mirror work is genuinely authentic and sparkling",
    comment:
      "Most brands use cheap plastic foil nowadays, but Pariwesh used genuine reflective mirror work with tight lock-stitching! The 3-piece palazzo set looks like high-end designer wear.",
    daysAgo: 6,
  },
  {
    rating: 5,
    name: "Archana K., Jaipur",
    title: "Rani pink color is so bright and royal",
    comment:
      "The mirror embroidery on the yoke is gorgeous. Palazzo is super comfortable with deep pockets. Got it delivered within 2 days in Jaipur!",
    daysAgo: 9,
  },
  {
    rating: 4,
    name: "Shweta Deshmukh, Nagpur",
    title: "Beautiful mirror embroidery, delicate wash needed",
    comment:
      "The mirror work is very heavy and sparkling. Need to hand-wash gently or dry clean to protect the threads. Looks so elegant for evening sangeet parties.",
    daysAgo: 13,
  },
  {
    rating: 5,
    name: "Radhika Mittal, Delhi",
    title: "Vanilla Cream set is pure understated luxury",
    comment:
      "The subtle cream vanilla tone with mirror work looks like something straight out of a royal heritage catalog. Clean silhouette, comfortable palazzo pants and lightweight dupatta.",
    daysAgo: 15,
  },
  {
    rating: 5,
    name: "Komal Bajaj, Faridabad",
    title: "Teal Blue mirror set — Total showstopper!",
    comment:
      "The teal blue shade is mesmerizing in person. Received endless compliments. The stitching quality at seams and hem is top-tier boutique finish.",
    daysAgo: 19,
  },

  // --- ANARKALI & FESTIVE SILK SETS ---
  {
    rating: 5,
    name: "Gitanjali R., Varanasi",
    title: "Banarasi silk finish with unbelievable flare",
    comment:
      "The zari weaving on the Banarasi Anarkali has a rich golden sheen that doesn't tarnish or feel rough on the neck. Comes with soft lining so it's not itchy at all. Royal outfit!",
    daysAgo: 11,
  },
  {
    rating: 5,
    name: "Suman Lata, Meerut",
    title: "Pure Chinon handwork is so fluid and grand",
    comment:
      "The sharara set in pure chinon fabric drapes like liquid silk. Handwork detailing on the neckline and dupatta borders is extraordinarily delicate. 100% recommended for weddings.",
    daysAgo: 17,
  },
  {
    rating: 4,
    name: "Monika Rawat, Dehradun",
    title: "Stunning Anarkali, dry-clean strongly recommended",
    comment:
      "The silk blend is heavy and rich. Flare is massive and looks picturesque in photos. Make sure to dry-clean it to maintain the zari luster. Very happy with the purchase.",
    daysAgo: 21,
  },
  {
    rating: 5,
    name: "Vandana Nair, Kochi",
    title: "Exceptional craft delivered all the way to Kerala",
    comment:
      "I was skeptical ordering from North India, but the parcel reached Kochi in 4 days! The embroidery precision and fabric quality are stellar. Fits true to the size chart.",
    daysAgo: 25,
  },

  // --- COTTON CO-ORD SETS & DAILY LUXURY ---
  {
    rating: 5,
    name: "Shalini Gupta, Ghaziabad",
    title: "Best co-ord set for daily office elegance",
    comment:
      "Pure cotton, minimal thread embroidery, and tailored trousers with functional pockets. Looks so professional and chic. Wore it all day with complete ease.",
    daysAgo: 4,
  },
  {
    rating: 5,
    name: "Roshni Sen, Chandigarh",
    title: "Cotton Slub fabric is super premium",
    comment:
      "The texture of the cotton slub is so rich. The embroidery doesn't pull, and the trousers don't become transparent when sitting. Perfect modern Indian wear.",
    daysAgo: 8,
  },
  {
    rating: 4,
    name: "Prerna K., Jodhpur",
    title: "Very chic co-ord, sleeves fit comfortably",
    comment:
      "Comfortable fit and breathable cotton. The embroidery details on the cuffs and collar look very classy. Loved the earthy tone.",
    daysAgo: 14,
  },
  {
    rating: 5,
    name: "Tanvi Saxena, Lucknow",
    title: "Jute floral embroidered 3-piece co-ord is a gem",
    comment:
      "The structured look of the jute-cotton blend combined with floral threadwork gives a very rich designer feel. Great for festive brunches and poojas.",
    daysAgo: 19,
  },
  {
    rating: 5,
    name: "Deepali Mehta, Rajkot",
    title: "Chanderi silk co-ord set feels like luxury lounge",
    comment:
      "Silky smooth against skin, gorgeous sheen, and perfect straight-cut pants. You can dress it up with jewelry or keep it minimal. Pariwesh delivers real quality.",
    daysAgo: 23,
  },

  // --- KURTIS & CASUAL TUNICS ---
  {
    rating: 5,
    name: "Akanksha Roy, Patna",
    title: "Daily wear kurti that actually lasts washes",
    comment:
      "Most budget tunics fade after two washes, but this cotton kurti stayed crisp and vibrant. Breathable fabric and neat stitching. Great value for everyday wear.",
    daysAgo: 5,
  },
  {
    rating: 5,
    name: "Manju Agarwal, Bikaner",
    title: "Softest cotton tunic, floral print is lovely",
    comment:
      "Bahut soft cotton hai, daily home aur market wear ke liye best hai. Print colors wash ke baad bhi intact rahe. True to size.",
    daysAgo: 15,
  },
  {
    rating: 4,
    name: "Garima S., Agra",
    title: "Comfortable casual kurti, delivered fast",
    comment:
      "Ordered in Wine Red, looks very graceful with white cigarette pants. Fabric is soft rayon-cotton blend, doesn't wrinkle easily.",
    daysAgo: 27,
  },
];

async function seedReviews() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const products = await Product.find({});
    console.log(`Found ${products.length} products in catalog.`);

    if (products.length === 0) {
      console.error("No products found to seed reviews for. Please ensure catalog has products.");
      process.exit(1);
    }

    // Clear existing reviews to have a clean, coherent review pool
    const existingCount = await Review.countDocuments({});
    console.log(`Existing reviews in database: ${existingCount}. Cleaning up...`);
    await Review.deleteMany({});
    console.log("Cleared existing reviews.");

    const reviewsToInsert = [];
    let reviewPoolIndex = 0;

    // Distribute reviews across all 40 products
    for (const product of products) {
      const isFarshi =
        /farshi|farsi/i.test(product.name) ||
        /farshi|farsi/i.test(product.description || "") ||
        /farshi/i.test(product.subCategory || "");

      // Farshi products get 4 to 6 detailed reviews; other products get 2 to 4 reviews
      const reviewCountForProduct = isFarshi
        ? Math.floor(Math.random() * 3) + 4 // 4 to 6 reviews
        : Math.floor(Math.random() * 2) + 2; // 2 to 3 reviews

      for (let i = 0; i < reviewCountForProduct; i++) {
        let template;

        if (isFarshi) {
          // Pick farshi-focused templates (first 18 templates)
          template = reviewPool[reviewPoolIndex % 18];
        } else {
          // Pick general/silk/co-ord/tunic templates (templates 18 onwards or modulo)
          template = reviewPool[(reviewPoolIndex + 18) % reviewPool.length];
        }
        reviewPoolIndex++;

        // Calculate staggered date
        const date = new Date();
        const daysToDeduct = (template.daysAgo || 5) + Math.floor(Math.random() * 4);
        date.setDate(date.getDate() - daysToDeduct);

        // Customize slight product-specific reference if needed
        let commentText = template.comment;
        let titleText = template.title;

        // If template references farshi but product is not farshi, make comment natural for suit/co-ord
        if (!isFarshi && /farshi/i.test(commentText)) {
          commentText = commentText
            .replace(/farshi salwar/gi, "bottom trouser")
            .replace(/farshi suit/gi, "suit set")
            .replace(/farshi silhouette/gi, "ensemble silhouette")
            .replace(/farshi/gi, "suit");
          titleText = titleText
            .replace(/farshi salwar/gi, "trouser fitting")
            .replace(/farshi suit/gi, "suit set")
            .replace(/farshi/gi, "outfit");
        }

        reviewsToInsert.push({
          product: product._id,
          name: template.name,
          rating: template.rating,
          title: titleText,
          comment: commentText,
          verifiedPurchase: true,
          status: "approved",
          source: "seed",
          helpfulCount: Math.floor(Math.random() * 8) + 1,
          createdAt: date,
          updatedAt: date,
        });
      }
    }

    console.log(`Prepared ${reviewsToInsert.length} unique authentic reviews to insert...`);
    const inserted = await Review.insertMany(reviewsToInsert);
    console.log(`Successfully seeded ${inserted.length} customer reviews across all products!`);

    // Recalculate rating and reviewsCount for each product
    console.log("Recalculating real average ratings and review counts for all products...");
    for (const product of products) {
      await Review.recalculateProductRating(product._id);
    }
    console.log("All product ratings and review counts successfully synchronized!");

    const updatedSample = await Product.find({}).limit(5).select("name rating reviewsCount");
    console.log("Sample updated products:");
    updatedSample.forEach((p) => {
      console.log(`- ${p.name}: Rating ${p.rating} ★ (${p.reviewsCount} reviews)`);
    });

    await mongoose.disconnect();
    console.log("Seeding process completed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  }
}

seedReviews();
