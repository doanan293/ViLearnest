type CropOptions = {
	outputSize: number;
	zoom: number;
	offsetX: number;
	offsetY: number;
	sourceName: string;
};

export async function cropAvatarImage(image: HTMLImageElement, options: CropOptions) {
	const canvas = document.createElement("canvas");
	canvas.width = options.outputSize;
	canvas.height = options.outputSize;

	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Could not edit avatar");
	}

	const sourceSize = Math.min(image.naturalWidth, image.naturalHeight) / options.zoom;
	const sourceX = (image.naturalWidth - sourceSize) / 2 - options.offsetX / options.zoom;
	const sourceY = (image.naturalHeight - sourceSize) / 2 - options.offsetY / options.zoom;

	context.drawImage(
		image,
		Math.max(0, Math.min(image.naturalWidth - sourceSize, sourceX)),
		Math.max(0, Math.min(image.naturalHeight - sourceSize, sourceY)),
		sourceSize,
		sourceSize,
		0,
		0,
		options.outputSize,
		options.outputSize,
	);

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(nextBlob) => {
				if (!nextBlob) {
					reject(new Error("Could not edit avatar"));
					return;
				}
				resolve(nextBlob);
			},
			"image/jpeg",
			0.82,
		);
	});

	return new File([blob], `${options.sourceName.replace(/\.[^.]+$/, "")}-cropped.jpg`, {
		type: "image/jpeg",
	});
}
