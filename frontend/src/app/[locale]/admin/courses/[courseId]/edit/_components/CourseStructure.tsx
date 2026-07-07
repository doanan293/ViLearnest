"use client";
import {
	DndContext,
	type DragEndEvent,
	type DraggableSyntheticListeners,
	KeyboardSensor,
	PointerSensor,
	rectIntersection,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FileText, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { AdminCourseSingularType } from "@/features/courses";
import {
	useReorderChaptersMutation,
	useReorderLessonsMutation,
} from "@/features/courses/hooks/use-admin-course-structure-mutations";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DeleteChapter } from "./DeleteChapter";
import { DeleteLesson } from "./DeleteLesson";
import { NewChapterModal } from "./NewChapterModal";
import { NewLessonModal } from "./NewLessonModal";

interface LessonItem {
	id: string;
	title: string;
	order: number;
}

interface ChapterItem {
	id: string;
	title: string;
	order: number;
	isOpen: boolean;
	lessons: Array<LessonItem>;
}

interface iAppProps {
	data: AdminCourseSingularType;
}

interface SortableItemProps {
	id: string;
	children: (listeners: DraggableSyntheticListeners) => ReactNode;
	className?: string;
	data?: { type: "chapter" | "lesson"; chapterId?: string };
	//only relevant for lessons
}

type DragItemType = "chapter" | "lesson";
type DragOver = NonNullable<DragEndEvent["over"]>;

export function CourseStructure({ data }: iAppProps) {
	const t = useTranslations("admin");
	const reorderChaptersMutation = useReorderChaptersMutation(data.id);
	const reorderLessonsMutation = useReorderLessonsMutation(data.id);
	const initialItems =
		data.chapter.map((chapter) => ({
			id: chapter.id,
			title: chapter.title,
			order: chapter.position,
			isOpen: true, //default chapters to open
			lessons: chapter.lessons.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				order: lesson.position,
			})),
		})) || [];

	const [items, setItems] = useState(initialItems);

	useEffect(() => {
		setItems((prevIems) => {
			const updatedItems =
				data.chapter.map((chapter) => ({
					id: chapter.id,
					title: chapter.title,
					order: chapter.position,
					isOpen: prevIems.find((item) => item.id === chapter.id)?.isOpen ?? true,
					lessons: chapter.lessons.map((lesson) => ({
						id: lesson.id,
						title: lesson.title,
						order: lesson.position,
					})),
				})) || [];
			return updatedItems;
		});
	}, [data]);

	function SortableItem({ children, id, className, data }: SortableItemProps) {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
			id: id,
			data: data,
		});

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
		};

		return (
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				className={cn("touch-none", className, isDragging ? "z-10" : "")}
			>
				{children(listeners)}
			</div>
		);
	}

	function getTargetChapterId(over: DragOver, overType: DragItemType) {
		if (overType === "chapter") return over.id;
		if (overType === "lesson") return over.data.current?.chapterId ?? null;
		return null;
	}

	function persistChapterOrder(
		updatedChapters: Array<ChapterItem>,
		previousItems: Array<ChapterItem>,
	) {
		const chaptersToUpdate = updatedChapters.map((chapter) => ({
			id: chapter.id,
			position: chapter.order,
		}));

		toast.promise(reorderChaptersMutation.mutateAsync(chaptersToUpdate), {
			loading: t("reorderingChapters"),
			success: (result) => {
				if (result.status === "success") return result.message;
				throw new Error(result.message);
			},
			error: () => {
				setItems(previousItems);
				return t("failedReorderChapters");
			},
		});
	}

	function reorderChapter(activeId: string | number, over: DragOver, overType: DragItemType) {
		const targetChapterId = getTargetChapterId(over, overType);
		if (!targetChapterId) {
			toast.error(t("chapterReorderUnknown"));
			return;
		}

		const oldIndex = items.findIndex((item) => item.id === activeId);
		const newIndex = items.findIndex((item) => item.id === targetChapterId);
		if (oldIndex === -1 || newIndex === -1) {
			toast.error(t("chapterReorderIndexMissing"));
			return;
		}

		const previousItems = [...items];
		const updatedChapters = arrayMove(items, oldIndex, newIndex).map((chapter, index) => ({
			...chapter,
			order: index + 1,
		}));

		setItems(updatedChapters);
		persistChapterOrder(updatedChapters, previousItems);
	}

	function getLessonReorderContext(
		activeId: string | number,
		overId: string | number,
		over: DragOver,
	) {
		const chapterId = over.data.current?.chapterId;
		const chapterIndex = items.findIndex((chapter) => chapter.id === chapterId);
		const chapterToUpdate = items[chapterIndex];
		const oldLessonIndex =
			chapterToUpdate?.lessons.findIndex((lesson) => lesson.id === activeId) ?? -1;
		const newLessonIndex =
			chapterToUpdate?.lessons.findIndex((lesson) => lesson.id === overId) ?? -1;

		return { chapterId, chapterIndex, chapterToUpdate, oldLessonIndex, newLessonIndex };
	}

	function persistLessonOrder(
		chapterId: string,
		updatedLessons: Array<LessonItem>,
		previousItems: Array<ChapterItem>,
	) {
		const lessonsToUpdate = updatedLessons.map((lesson) => ({
			id: lesson.id,
			position: lesson.order,
		}));

		toast.promise(reorderLessonsMutation.mutateAsync({ chapterId, lessons: lessonsToUpdate }), {
			loading: t("reorderingLessons"),
			success: (result) => {
				if (result.status === "success") return t("lessonsReordered");
				throw new Error(result.message);
			},
			error: () => {
				setItems(previousItems);
				return t("failedReorderLessons");
			},
		});
	}

	function reorderLesson(activeId: string | number, overId: string | number, over: DragOver) {
		const { chapterId, chapterIndex, chapterToUpdate, oldLessonIndex, newLessonIndex } =
			getLessonReorderContext(activeId, overId, over);
		if (!chapterId || chapterIndex === -1 || !chapterToUpdate) {
			toast.error(t("lessonReorderChapterMissing"));
			return;
		}
		if (oldLessonIndex === -1 || newLessonIndex === -1) {
			toast.error(t("lessonReorderMissing"));
			return;
		}

		const previousItems = [...items];
		const updatedLessons = arrayMove(chapterToUpdate.lessons, oldLessonIndex, newLessonIndex).map(
			(lesson, index) => ({
				...lesson,
				order: index + 1,
			}),
		);
		const newItems = [...items];
		newItems[chapterIndex] = { ...chapterToUpdate, lessons: updatedLessons };

		setItems(newItems);
		persistLessonOrder(chapterId, updatedLessons, previousItems);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const activeType = active.data.current?.type as DragItemType;
		const overType = over.data.current?.type as DragItemType;

		if (activeType === "chapter") {
			reorderChapter(active.id, over, overType);
			return;
		}

		if (activeType === "lesson" && overType === "lesson") {
			reorderLesson(active.id, over.id, over);
		}
	}

	function toggleChapter(chapterId: string) {
		setItems(
			items.map((chapter) =>
				chapter.id === chapterId ? { ...chapter, isOpen: !chapter.isOpen } : chapter,
			),
		);
	}

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	return (
		<DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd} sensors={sensors}>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between border-b border-border">
					<CardTitle>{t("chapters")}</CardTitle>
					<NewChapterModal courseId={data.id} />
				</CardHeader>
				<CardContent className="space-y-8">
					<SortableContext items={items} strategy={verticalListSortingStrategy}>
						{items.map((item) => (
							<SortableItem id={item.id} data={{ type: "chapter" }} key={item.id}>
								{(listeners) => (
									<Card>
										<Collapsible open={item.isOpen} onOpenChange={() => toggleChapter(item.id)}>
											<div className="flex items-center justify-between p-3 border-b border-border">
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="icon"
														className="cursor-grab opacity-60 hover:opacity-100"
														{...listeners}
													>
														<GripVertical className="size-4" />
													</Button>
													<CollapsibleTrigger asChild>
														<Button size="icon" variant="ghost" className="flex items-center">
															{item.isOpen ? (
																<ChevronDown className="size-4" />
															) : (
																<ChevronRight className="size-4" />
															)}
														</Button>
													</CollapsibleTrigger>
													<p className="cursor-pointer hover:text-primary pl-2">{item.title}</p>
												</div>
												<DeleteChapter chapterId={item.id} courseId={data.id} />
											</div>
											<CollapsibleContent>
												<div className="p-1">
													<SortableContext
														items={item.lessons.map((lesson) => lesson.id)}
														strategy={verticalListSortingStrategy}
													>
														{item.lessons.map((lesson) => (
															<SortableItem
																key={lesson.id}
																id={lesson.id}
																data={{ type: "lesson", chapterId: item.id }}
															>
																{(lessonListeners) => (
																	<div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
																		<div className="flex items-center gap-2">
																			<Button variant="ghost" size="icon" {...lessonListeners}>
																				<GripVertical className="size-4" />
																			</Button>
																			<FileText className="size-4" />
																			<Link
																				href={`/admin/courses/${data.id}/${item.id}/${lesson.id}`}
																			>
																				{lesson.title}
																			</Link>
																		</div>
																		<DeleteLesson
																			chapterId={item.id}
																			courseId={data.id}
																			lessonId={lesson.id}
																		/>
																	</div>
																)}
															</SortableItem>
														))}
													</SortableContext>
													<div className="p-2">
														<NewLessonModal chapterId={item.id} courseId={data.id} />
													</div>
												</div>
											</CollapsibleContent>
										</Collapsible>
									</Card>
								)}
							</SortableItem>
						))}
					</SortableContext>
				</CardContent>
			</Card>
		</DndContext>
	);
}
