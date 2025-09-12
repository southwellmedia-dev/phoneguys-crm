import { Metadata } from 'next';
import StatusPageClient from './status-page-client';

export const metadata: Metadata = {
  title: 'Check Repair Status | The Phone Guys',
  description: 'Check the status of your repair or appointment using your reference number and email address.',
};

export default function StatusPage() {
  return <StatusPageClient />;
}