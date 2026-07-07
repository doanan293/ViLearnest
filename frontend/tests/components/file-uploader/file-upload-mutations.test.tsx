import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	useDeleteFileMutation,
	useFileUploadMutation,
} from "@/components/file-uploader/use-file-upload-mutations";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
	api: {
		s3: {
			deleteFile: jest.fn(),
			getPresignedUrl: jest.fn(),
		},
	},
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe("file upload mutation hooks", () => {
	beforeEach(() => {
		global.fetch = jest.fn(async () => ({ ok: true })) as jest.Mock;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("presigns and uploads a file with fetch", async () => {
		jest.mocked(api.s3.getPresignedUrl).mockResolvedValue({
			uploadUrl: "https://upload.example.com/file",
			key: "uploads/file.png",
		});
		const file = new File(["image"], "file.png", { type: "image/png" });
		const { result } = renderHook(() => useFileUploadMutation(), {
			wrapper: createWrapper(),
		});

		let uploadResult: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
		await act(async () => {
			uploadResult = await result.current.mutateAsync({ file });
		});

		expect(uploadResult).toEqual({ key: "uploads/file.png" });
		expect(api.s3.getPresignedUrl).toHaveBeenCalledWith("file.png", "image/png");
		expect(fetch).toHaveBeenCalledWith("https://upload.example.com/file", {
			method: "PUT",
			headers: { "Content-Type": "image/png" },
			body: file,
		});
	});

	it("deletes files through the shared mutation", async () => {
		jest.mocked(api.s3.deleteFile).mockResolvedValue({ message: "deleted" });
		const { result } = renderHook(() => useDeleteFileMutation(), {
			wrapper: createWrapper(),
		});

		await act(async () => {
			await result.current.mutateAsync("uploads/file.png");
		});

		expect(api.s3.deleteFile).toHaveBeenCalledWith("uploads/file.png");
	});
});
