import { Metadata } from 'next';
import { ReportsClient } from './reports-client';

export const metadata: Metadata = {
  title: 'Reports | The Phone Guys CRM',
  description: 'Business analytics and reporting dashboard',
};

export default function ReportsPage() {
  return <ReportsClient />;
}