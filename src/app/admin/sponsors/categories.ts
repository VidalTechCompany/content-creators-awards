export interface Category {
    id: string;
    name: string;
    subcategories: string[];
}

/**
 * Centralized configuration for award categories and their respective subcategories.
 * This structure can be used for UI components, database seeding, and validation.
 */
export const AWARD_CATEGORIES: Category[] = [
    {
        id: "tiktok",
        name: "TikTok Categories",
        subcategories: [
            "Best TikTok Creator",
            "Best Comedy TikToker",
            "Best Dance Creator",
            "Best Lifestyle TikToker",
            "Best Couple Content Creator",
            "Best Educational TikTok Creator",
            "Best Viral Content",
        ],
    },
    {
        id: "youtube",
        name: "YouTube Categories",
        subcategories: [
            "Best YouTuber",
            "Best Vlog Channel",
            "Best Entertainment Channel",
            "Best Documentary Creator",
            "Best Storytelling Creator",
            "Best Short-Form Video Creator",
            "Best Long-Form Content Creator",
        ],
    },
    {
        id: "instagram",
        name: "Instagram Categories",
        subcategories: [
            "Best Instagram Creator",
            "Best Fashion Influencer",
            "Best Beauty Creator",
            "Best Travel Creator",
            "Best Food Content Creator",
            "Best Photography Page",
        ],
    },
    {
        id: "lifestyle-culture",
        name: "Lifestyle & Culture",
        subcategories: [
            "Best Fitness Creator",
            "Best Wellness Creator",
            "Best Parenting Creator",
            "Best Campus Creator",
            "Best Relationship Content Creator",
            "Best Motivational Creator",
        ],
    },
    {
        id: "entertainment",
        name: "Entertainment Categories",
        subcategories: [
            "Best Comedy Creator",
            "Best Prank Creator",
            "Best Dance Crew",
            "Best Music Content Creator",
            "Best DJ Content Creator",
            "Best Celebrity Influencer",
        ],
    },
    {
        id: "business-educational",
        name: "Business & Educational Categories",
        subcategories: [
            "Best Business Creator",
            "Best Financial Education Creator",
            "Best Tech Creator",
            "Best Educational Platform",
            "Best Entrepreneur Creator",
        ],
    },
    {
        id: "podcast-media",
        name: "Podcast & Media Categories",
        subcategories: [
            "Best Podcast",
            "Best Podcast Host",
            "Best Online Media Platform",
            "Best Interview Series",
        ],
    },
    {
        id: "fashion-beauty",
        name: "Fashion & Beauty",
        subcategories: [
            "Best Fashion Stylist Creator",
            "Best Makeup Creator",
            "Best Hair & Beauty Creator",
            "Best Fashion Brand Collaboration",
        ],
    },
    {
        id: "photography-videography",
        name: "Photography & Videography",
        subcategories: [
            "Best Photographer",
            "Best Videographer",
            "Best Cinematic Creator",
            "Best Event Coverage Team",
        ],
    },
    {
        id: "brand-marketing",
        name: "Brand & Marketing Awards",
        subcategories: [
            "Best Brand Influencer",
            "Best Sponsored Campaign",
            "Best Brand Collaboration",
            "Most Influential Brand Ambassador",
        ],
    },
    {
        id: "community-impact",
        name: "Community & Impact Awards",
        subcategories: [
            "Social Impact Creator Award",
            "Community Champion Award",
            "Youth Inspiration Award",
            "Mental Health Awareness Creator",
            "Environmental Awareness Creator",
        ],
    },
    {
        id: "special-recognition",
        name: "Special Recognition Awards",
        subcategories: [
            "Lifetime Achievement Award",
            "Hall of Fame Award",
            "Pioneer Creator Award",
            "Icon Award",
            "Outstanding Contribution to Digital Media",
        ],
    },
    {
        id: "fun-categories",
        name: "Fun Categories (Optional)",
        subcategories: [
            "Best Celebrity Lookalike Creator",
            "Best Meme Page",
            "Most Entertaining Live Creator",
            "Most Interactive Creator",
            "Fan Favorite Creator",
        ],
    },
];