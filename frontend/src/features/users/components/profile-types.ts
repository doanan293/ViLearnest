export type ProfileDetails = {
	dateOfBirth: string | null;
	gender: string | null;
	phoneNumber: string | null;
	phoneVerified: boolean;
	country: string | null;
	province: string | null;
	district: string | null;
	ward: string | null;
	addressLine: string | null;
	bio: string | null;
	facebookUrl: string | null;
	linkedinUrl: string | null;
	githubUrl: string | null;
	websiteUrl: string | null;
	occupation: string | null;
	organization: string | null;
	education: string | null;
};

export type ProfileResponse = {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string | null;
	createdAt: string;
	profile: ProfileDetails | null;
};

export type AdminUserSummary = {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string | null;
	createdAt: string;
	profile: Pick<ProfileDetails, "phoneNumber" | "phoneVerified"> | null;
};
