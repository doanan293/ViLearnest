// Level and category are fixed English values in the database; their labels come from the
// "courses" message namespace. A category without a message key is shown as stored.
type Translate = (key: string) => string;

const CATEGORY_KEYS: Record<string, string> = {
	Development: "development",
	Business: "business",
	"Finance & Accounting": "financeAccounting",
	"IT & Software": "itSoftware",
	"Office Productivity": "officeProductivity",
	"Personal Development": "personalDevelopment",
	Design: "design",
	Marketing: "marketing",
	"Health & Fitness": "healthFitness",
	Lifestyle: "lifestyle",
	Music: "music",
	"Teaching & Academics": "teachingAcademics",
};

export function levelLabel(t: Translate, level: string): string {
	return t(`levels.${level}`);
}

export function categoryLabel(t: Translate, category: string): string {
	const key = CATEGORY_KEYS[category];
	return key ? t(`categories.${key}`) : category;
}
