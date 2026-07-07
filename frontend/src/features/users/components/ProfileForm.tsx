"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	type ProfileSchemaInput,
	type ProfileSchemaType,
	profileGenderOptions,
	profileSchema,
} from "@/lib/zodSchemas";
import { useUpdateProfileMutation } from "../hooks/use-update-profile-mutation";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";
import type { ProfileResponse } from "./profile-types";

type Props = {
	profile: ProfileResponse;
	mode: "me" | "admin";
	userId?: string;
	onSaved?: (profile: ProfileResponse) => void;
};

const emptyProfileDetails = {
	dateOfBirth: null,
	gender: null,
	phoneNumber: null,
	country: null,
	province: null,
	district: null,
	ward: null,
	addressLine: null,
	bio: null,
	facebookUrl: null,
	linkedinUrl: null,
	githubUrl: null,
	websiteUrl: null,
	occupation: null,
	organization: null,
	education: null,
} satisfies Omit<ProfileSchemaType, "name" | "image">;

function defaults(profile: ProfileResponse): ProfileSchemaType {
	const details = profile.profile ?? emptyProfileDetails;

	return {
		name: profile.name,
		image: profile.image,
		dateOfBirth: details.dateOfBirth?.slice(0, 10) ?? null,
		gender: normalizeGender(details.gender),
		phoneNumber: details.phoneNumber,
		country: details.country,
		province: details.province,
		district: details.district,
		ward: details.ward,
		addressLine: details.addressLine,
		bio: details.bio,
		facebookUrl: details.facebookUrl,
		linkedinUrl: details.linkedinUrl,
		githubUrl: details.githubUrl,
		websiteUrl: details.websiteUrl,
		occupation: details.occupation,
		organization: details.organization,
		education: details.education,
	};
}

function normalizeGender(gender: string | null): ProfileSchemaType["gender"] {
	return profileGenderOptions.includes(gender as (typeof profileGenderOptions)[number])
		? (gender as ProfileSchemaType["gender"])
		: null;
}

function parseDateValue(value: string | null): Date | undefined {
	if (!value) return undefined;
	const [year, month, day] = value.split("-").map(Number);
	if (!year || !month || !day) return undefined;

	return new Date(year, month - 1, day);
}

function formatDateValue(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function ProfileForm({ profile, mode, userId, onSaved }: Props) {
	const updateProfile = useUpdateProfileMutation({ mode, userId, onSaved });
	const form = useForm<ProfileSchemaInput, unknown, ProfileSchemaType>({
		resolver: zodResolver(profileSchema),
		defaultValues: defaults(profile),
	});
	const saving = form.formState.isSubmitting || updateProfile.isPending;

	async function onSubmit(values: ProfileSchemaType) {
		try {
			await updateProfile.mutateAsync(values);
			toast.success("Profile saved");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Profile save failed");
		}
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
			<section className="space-y-4">
				<h2 className="text-lg font-semibold">Basic information</h2>
				<ProfileAvatarUploader
					value={form.watch("image") ?? null}
					name={form.watch("name") ?? profile.name}
					email={profile.email}
					onChange={(value) => form.setValue("image", value, { shouldDirty: true })}
				/>
				<div className="grid gap-4 md:grid-cols-2">
					<Field label="Full name" error={form.formState.errors.name?.message}>
						<Input {...form.register("name")} />
					</Field>
					<Field label="Email">
						<Input value={profile.email} readOnly aria-readonly="true" />
					</Field>
					<ControlledDatePicker control={form.control} name="dateOfBirth" label="Date of birth" />
					<ControlledGenderSelect control={form.control} name="gender" label="Gender" />
				</div>
				<ControlledTextarea control={form.control} name="bio" label="Bio" rows={4} />
			</section>

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">Contact and address</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<ControlledInput control={form.control} name="phoneNumber" label="Phone number" />
					<ControlledInput control={form.control} name="country" label="Country" />
					<ControlledInput control={form.control} name="province" label="Province / city" />
					<ControlledInput control={form.control} name="district" label="District" />
					<ControlledInput control={form.control} name="ward" label="Ward" />
					<ControlledInput control={form.control} name="addressLine" label="Address line" />
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">Social links</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<ControlledInput control={form.control} name="facebookUrl" label="Facebook" />
					<ControlledInput control={form.control} name="linkedinUrl" label="LinkedIn" />
					<ControlledInput control={form.control} name="githubUrl" label="GitHub" />
					<ControlledInput control={form.control} name="websiteUrl" label="Website" />
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-lg font-semibold">Work and education</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<ControlledInput control={form.control} name="occupation" label="Occupation" />
					<ControlledInput control={form.control} name="organization" label="Organization" />
					<ControlledInput control={form.control} name="education" label="Education" />
				</div>
			</section>

			<Button type="submit" disabled={saving}>
				{saving ? "Saving..." : "Save changes"}
			</Button>
		</form>
	);
}

function ControlledDatePicker({ control, name, label }: ControlledProps) {
	const [open, setOpen] = useState(false);

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const selectedDate = parseDateValue((field.value as string | null) ?? null);

				return (
					<Field label={label} error={fieldState.error?.message}>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									aria-label={label}
									className={cn(
										"w-full justify-start text-left font-normal",
										!selectedDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="size-4" />
									{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Pick a date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={selectedDate}
									defaultMonth={selectedDate}
									disabled={(date) => date > new Date()}
									onSelect={(date) => {
										if (!date) return;
										field.onChange(formatDateValue(date));
										field.onBlur();
										setOpen(false);
									}}
								/>
							</PopoverContent>
						</Popover>
					</Field>
				);
			}}
		/>
	);
}

function ControlledGenderSelect({ control, name, label }: ControlledProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field label={label} error={fieldState.error?.message}>
					<Select
						value={normalizeGender((field.value as string | null) ?? null) ?? undefined}
						onValueChange={field.onChange}
					>
						<SelectTrigger aria-label={label} className="w-full">
							<SelectValue placeholder="Select gender" />
						</SelectTrigger>
						<SelectContent>
							{profileGenderOptions.map((gender) => (
								<SelectItem key={gender} value={gender}>
									{gender}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			)}
		/>
	);
}

type ControlledProps = {
	control: ReturnType<typeof useForm<ProfileSchemaInput, unknown, ProfileSchemaType>>["control"];
	name: keyof ProfileSchemaInput;
	label: string;
	type?: string;
	rows?: number;
};

function ControlledInput({ control, name, label, type = "text" }: ControlledProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field label={label} error={fieldState.error?.message}>
					<Input
						type={type}
						name={field.name}
						ref={field.ref}
						onBlur={field.onBlur}
						value={(field.value as string | null) ?? ""}
						onChange={(event) => field.onChange(event.target.value)}
					/>
				</Field>
			)}
		/>
	);
}

function ControlledTextarea({ control, name, label, rows = 3 }: ControlledProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field label={label} error={fieldState.error?.message}>
					<Textarea
						name={field.name}
						ref={field.ref}
						onBlur={field.onBlur}
						rows={rows}
						value={(field.value as string | null) ?? ""}
						onChange={(event) => field.onChange(event.target.value)}
					/>
				</Field>
			)}
		/>
	);
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{children}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
