"use client";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { useLessonContentQuery } from "@/features/courses/hooks/use-course-player-query";
import { useMarkLessonCompleteMutation } from "@/features/courses/hooks/use-enrollment-mutations";
import { useConfetti } from "@/hooks/use-confetti";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { LessonSkeleton } from "./LessonSkeleton";

interface iAppProps {
	lessonId: string;
}

function VideoPlayer({
	browserNoVideo,
	noCaptions,
	noVideo,
	thumbnailKey,
	videoKey,
}: {
	browserNoVideo: string;
	noCaptions: string;
	noVideo: string;
	thumbnailKey: string;
	videoKey: string;
}) {
	const videoUrl = useConstructUrl(videoKey);
	const thumbnailUrl = useConstructUrl(thumbnailKey);

	if (!videoKey) {
		return (
			<div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
				<BookIcon className="size-16 text-primary mb-4" />
				<p className="text-muted-foreground">{noVideo}</p>
			</div>
		);
	}

	return (
		<div className="aspect-video bg-black rounded-lg relative overflow-hidden">
			<video className="w-full h-full object-cover" poster={thumbnailUrl} controls>
				<source src={videoUrl} type="video/mp4" />
				<source src={videoUrl} type="video/webm" />
				<source src={videoUrl} type="video/ogg" />
				<track kind="captions" label={noCaptions} />
				{browserNoVideo}
			</video>
		</div>
	);
}

export function CourseContent({ lessonId }: iAppProps) {
	const markComplete = useMarkLessonCompleteMutation();
	const { data } = useLessonContentQuery(lessonId);
	const { triggerConfetti } = useConfetti();
	const t = useTranslations("dashboard");
	const tErrors = useTranslations("errors");

	if (!data) {
		return <LessonSkeleton />;
	}

	const lesson = data;

	const completed = lesson.lessonProgess.some(
		(progress) => progress.lessonId === lesson.id && progress.completed,
	);

	function onSubmit() {
		markComplete.mutate(
			{ lessonId: lesson.id, slug: lesson.Chapter.Course.slug },
			{
				onSuccess: (result) => {
					if (result.status === "success") {
						toast.success(result.message);
						triggerConfetti();
					} else if (result.status === "error") {
						toast.error(result.message);
					}
				},
				onError: () => {
					toast.error(tErrors("unexpected"));
				},
			},
		);
	}

	return (
		<div className="flex flex-col h-full bg-background pl-6">
			<VideoPlayer
				thumbnailKey={lesson.thumbnailKey ?? ""}
				videoKey={lesson.videoKey ?? ""}
				noVideo={t("noVideo")}
				noCaptions={t("noCaptions")}
				browserNoVideo={t("browserNoVideo")}
			/>
			<div className="py-4 border-b">
				{completed ? (
					<Button variant="outline" className="bg-green-500/10 text-green-500 hover:text-green-600">
						<CheckCircle className="size-4 mr-2 text-green-500" />
						{t("completed")}
					</Button>
				) : (
					<Button variant="outline" onClick={onSubmit} disabled={markComplete.isPending}>
						<CheckCircle className="size-4 mr-2 text-green-500" />
						{t("markAsComplete")}
					</Button>
				)}
			</div>
			<div className="space-y-3 pt-3">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">{lesson.title}</h1>
				{lesson.description && <RenderDescription json={JSON.parse(lesson.description)} />}
			</div>
		</div>
	);
}
