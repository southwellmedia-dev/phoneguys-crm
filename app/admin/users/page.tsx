import { Metadata } from "next";
import { UserRepository } from "@/lib/repositories/user.repository";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage system users and roles",
};

export default async function UsersPage() {
  const userRepo = new UserRepository();
  const users = await userRepo.findAll();

  return <UsersClient initialUsers={users} />;
}