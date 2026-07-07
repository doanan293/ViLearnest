"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { useAdminUsersQuery } from "../hooks/use-admin-users-query";
import { avatarUrl } from "../utils/avatar-url";

export function AdminUsersClientSection() {
	const { data: users = [], isError, isFetching, refetch } = useAdminUsersQuery();

	if (isError) {
		return (
			<div className="space-y-3 rounded-md border p-6">
				<p className="text-muted-foreground text-sm">Could not load users.</p>
				<Button
					type="button"
					variant="outline"
					disabled={isFetching}
					onClick={() => void refetch()}
				>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Phone status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>
								<div className="flex items-center gap-3">
									<Avatar className="size-9 rounded-lg">
										<AvatarImage src={avatarUrl(user.image, user.email)} alt={user.name} />
										<AvatarFallback className="rounded-lg">
											{user.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="font-medium">{user.name}</div>
										<div className="text-muted-foreground text-sm">{user.email}</div>
									</div>
								</div>
							</TableCell>
							<TableCell>{user.role ?? "user"}</TableCell>
							<TableCell>{user.profile?.phoneNumber ?? "-"}</TableCell>
							<TableCell>
								<Badge variant={user.profile?.phoneVerified ? "default" : "secondary"}>
									{user.profile?.phoneVerified ? "Verified" : "Unverified"}
								</Badge>
							</TableCell>
							<TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
							<TableCell className="text-right">
								<Button asChild variant="outline" size="sm">
									<Link href={`/admin/users/${user.id}/profile`}>Edit</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
