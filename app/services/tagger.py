from app.models.expense import ExpenseCategory

# Keyword map — title keywords → category
CATEGORY_KEYWORDS = {
    ExpenseCategory.SOFTWARE: [
        "adobe", "figma", "notion", "slack", "zoom", "github",
        "gitlab", "jira", "canva", "postman", "vs code", "jetbrains",
        "microsoft", "office", "antivirus", "software", "app", "saas",
        "subscription", "license", "aws", "azure", "gcp", "hosting",
        "domain", "vercel", "netlify", "heroku", "digitalocean"
    ],
    ExpenseCategory.EQUIPMENT: [
        "laptop", "computer", "monitor", "keyboard", "mouse", "headphone",
        "webcam", "microphone", "printer", "scanner", "hard disk", "ssd",
        "ram", "charger", "cable", "hub", "dock", "tablet", "ipad",
        "phone", "mobile", "camera", "tripod", "equipment", "hardware"
    ],
    ExpenseCategory.INTERNET: [
        "internet", "wifi", "broadband", "jio", "airtel", "bsnl",
        "tata", "data", "sim", "recharge", "hotspot", "fiber"
    ],
    ExpenseCategory.TRAVEL: [
        "flight", "train", "bus", "cab", "uber", "ola", "rapido",
        "auto", "taxi", "hotel", "stay", "accommodation", "travel",
        "petrol", "diesel", "fuel", "toll", "parking", "metro"
    ],
    ExpenseCategory.COWORKING: [
        "coworking", "co-working", "wework", "awfis", "91springboard",
        "office space", "desk", "workspace", "meeting room"
    ],
    ExpenseCategory.EDUCATION: [
        "udemy", "coursera", "pluralsight", "linkedin learning",
        "skillshare", "book", "course", "tutorial", "training",
        "workshop", "conference", "seminar", "certification", "exam"
    ],
    ExpenseCategory.MARKETING: [
        "facebook ads", "google ads", "instagram", "linkedin ads",
        "marketing", "advertising", "promotion", "seo", "design",
        "logo", "branding", "business card", "portfolio"
    ],
    ExpenseCategory.UTILITIES: [
        "electricity", "water", "rent", "maintenance", "repair",
        "ac", "fan", "light", "bill", "utility"
    ],
    ExpenseCategory.FOOD: [
        "food", "lunch", "dinner", "breakfast", "coffee", "tea",
        "restaurant", "swiggy", "zomato", "cafe", "snacks"
    ],
}

# Categories that are tax deductible for Indian freelancers
TAX_DEDUCTIBLE_CATEGORIES = {
    ExpenseCategory.SOFTWARE,
    ExpenseCategory.EQUIPMENT,
    ExpenseCategory.INTERNET,
    ExpenseCategory.TRAVEL,
    ExpenseCategory.COWORKING,
    ExpenseCategory.EDUCATION,
    ExpenseCategory.MARKETING,
    ExpenseCategory.UTILITIES,
}

def detect_category(title: str) -> ExpenseCategory:
    """Auto-detect expense category from title keywords"""
    title_lower = title.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in title_lower for keyword in keywords):
            return category
    return ExpenseCategory.OTHER

def is_tax_deductible(category: ExpenseCategory) -> bool:
    """Check if expense category is tax deductible"""
    return category in TAX_DEDUCTIBLE_CATEGORIES

def tag_expense(title: str) -> dict:
    """Full auto-tagging — returns category + deductibility"""
    category = detect_category(title)
    deductible = is_tax_deductible(category)
    return {
        "category": category,
        "is_tax_deductible": deductible,
    }
