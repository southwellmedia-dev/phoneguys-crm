import { Metadata } from "next";
import { ServiceRepository } from "@/lib/repositories/service.repository";
import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Services Management",
  description: "Manage repair services and pricing",
};

export default async function ServicesPage() {
  const serviceRepo = new ServiceRepository();
  const services = await serviceRepo.getActiveServices();

  return <ServicesClient initialServices={services} />;
}